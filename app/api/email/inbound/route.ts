import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createInboundEmail } from '@/lib/firebase/firestore'

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

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

  // Some payloads provide content parts as arrays.
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
 * Resend Inbound Email Webhook
 * 
 * Receives POST requests from Resend when an email is sent to your domain.
 * Configure this URL in Resend dashboard → Webhooks → email.received event.
 * URL: https://diasporavote.org/api/email/inbound
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const svixId = request.headers.get('svix-id')
      const svixTimestamp = request.headers.get('svix-timestamp')
      const svixSignature = request.headers.get('svix-signature')

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing svix headers')
        return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 })
      }

      const wh = new Webhook(WEBHOOK_SECRET)
      try {
        wh.verify(body, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        })
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // Only process email.received events
    if (event.type !== 'email.received') {
      return NextResponse.json({ received: true })
    }

    const data = event.data
    if (!data) {
      return NextResponse.json({ error: 'No data in event' }, { status: 400 })
    }

    // Extract email fields from the Resend webhook payload
    const from = data.from || ''
    const fromName = from.includes('<')
      ? from.split('<')[0].trim().replace(/"/g, '')
      : from.split('@')[0] || ''
    const fromEmail = from.includes('<')
      ? from.match(/<(.+?)>/)?.[1] || from
      : from

    const to = Array.isArray(data.to) ? data.to.join(', ') : (data.to || '')
    const subject = data.subject || '(No Subject)'
    const extracted = extractBodyText(data)
    const body_text = extracted.text
    const html = extracted.html

    // Store in Firestore
    const emailId = await createInboundEmail({
      from: fromEmail,
      fromName: fromName || undefined,
      to,
      subject,
      body: body_text,
      html: html || undefined,
      isRead: false,
      isStarred: false,
      resendEmailId: data.email_id || undefined,
    })

    console.log('Inbound email stored:', emailId, 'from:', fromEmail, 'subject:', subject)

    return NextResponse.json({ success: true, id: emailId })
  } catch (error: any) {
    console.error('Error processing inbound email webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process inbound email' },
      { status: 500 }
    )
  }
}
