import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createInboundEmail } from '@/lib/firebase/firestore'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const resend = new Resend(process.env.RESEND_API_KEY)

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractBodyText(data: any): { text: string; html: string } {
  const directText = pickFirstString(
    data?.text,
    data?.textBody,
    data?.plain,
    data?.body,
    data?.snippet,
    data?.preview,
    data?.content?.text,
    data?.payload?.text,
    data?.email?.text,
    data?.email?.textBody
  )

  const directHtml = pickFirstString(
    data?.html,
    data?.htmlBody,
    data?.content?.html,
    data?.payload?.html,
    data?.email?.html,
    data?.email?.htmlBody
  )

  const contentParts = Array.isArray(data?.content) ? data.content : []
  const partText = contentParts
    .map((part: any) => pickFirstString(part?.text, part?.body, part?.value, part?.content))
    .find(Boolean) || ''
  const partHtml = contentParts
    .map((part: any) => pickFirstString(part?.html))
    .find(Boolean) || ''

  const html = directHtml || partHtml
  const text = directText || partText || (html ? htmlToPlainText(html) : '')

  return { text, html }
}

/**
 * Sync received emails from Resend API into Firestore.
 * POST /api/email/sync
 * 
 * Fetches received emails from Resend and stores them in Firestore.
 * Duplicates in a single payload are skipped by `email.id`.
 */
export async function POST() {
  try {
    // Fetch received emails from Resend
    // @ts-ignore - Resend SDK types may not include emails.received yet
    const { data: receivedEmails, error } = await resend.emails.list()

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json({ error: 'Failed to fetch from Resend' }, { status: 500 })
    }

    let synced = 0
    const emails = receivedEmails?.data || receivedEmails || []
    const seenIds = new Set<string>()

    for (const email of emails) {
      // Skip duplicates returned in the same Resend response payload.
      if (email.id) {
        if (seenIds.has(email.id)) continue
        seenIds.add(email.id)
      }

      let detailEmail: any = email
      if (email.id) {
        try {
          const emailsApi: any = (resend as any).emails
          let details: any = null
          if (typeof emailsApi?.receiving?.get === 'function') {
            details = await emailsApi.receiving.get(email.id)
          } else if (typeof emailsApi?.get === 'function') {
            details = await emailsApi.get(email.id)
          } else if (typeof emailsApi?.retrieve === 'function') {
            details = await emailsApi.retrieve(email.id)
          }
          detailEmail = details?.data || details || email
        } catch (detailError) {
          // Fall back to list payload if detail endpoint is unavailable/fails.
          detailEmail = email
        }
      }

      const from = detailEmail.from || email.from || ''
      const fromName = from.includes('<')
        ? from.split('<')[0].trim().replace(/"/g, '')
        : from.split('@')[0] || ''
      const fromEmail = from.includes('<')
        ? from.match(/<(.+?)>/)?.[1] || from
        : from

      const toSource = detailEmail.to ?? email.to
      const to = Array.isArray(toSource)
        ? toSource.join(', ')
        : (toSource || '')

      const extracted = extractBodyText(detailEmail)
      const fallbackExtracted = detailEmail === email ? extracted : extractBodyText(email)
      const bodyText = extracted.text || fallbackExtracted.text || detailEmail.subject || email.subject || ''
      const html = extracted.html || fallbackExtracted.html || undefined

      try {
        await createInboundEmail({
          from: fromEmail,
          fromName: fromName || undefined,
          to,
          subject: detailEmail.subject || email.subject || '(No Subject)',
          body: bodyText,
          html,
          isRead: false,
          isStarred: false,
          resendEmailId: email.id || undefined,
        })
        synced++
      } catch (writeError) {
        console.error('Failed to store synced email:', email.id, writeError)
      }
    }

    return NextResponse.json({ success: true, synced, total: emails.length })
  } catch (error: any) {
    console.error('Error syncing emails:', error)
    return NextResponse.json(
      { error: 'Failed to sync emails: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
