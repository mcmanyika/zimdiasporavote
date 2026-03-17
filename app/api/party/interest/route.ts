import { NextRequest, NextResponse } from 'next/server'
import { sendCustomEmail } from '@/lib/email'
import { createEmailLog } from '@/lib/firebase/firestore'
import { createPartyInterestSubmission } from '@/features/party'
import { getAdminDb } from '@/lib/firebase/admin'

function parseRecipients(): string[] {
  const envValue =
    process.env.PARTY_NOTIFY_EMAILS ||
    process.env.ADMIN_NOTIFY_EMAILS ||
    ''

  return envValue
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.includes('@'))
}

async function getAdminRecipients(): Promise<string[]> {
  const byEnv = parseRecipients()
  if (byEnv.length > 0) return byEnv

  try {
    const db = getAdminDb()
    const snap = await db.collection('users').where('role', '==', 'admin').get()
    const emails = snap.docs
      .map((doc: any) => String(doc.data()?.email || '').trim())
      .filter((email: string) => email.includes('@'))
    return Array.from(new Set(emails))
  } catch (error) {
    console.warn('Unable to fetch admin recipients from Firestore:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName = String(body?.fullName || '').trim()
    const email = String(body?.email || '').trim()
    const phone = String(body?.phone || '').trim()
    const province = String(body?.province || '').trim()
    const district = String(body?.district || '').trim()
    const roleInterest = String(body?.roleInterest || '').trim()
    const message = String(body?.message || '').trim()

    if (!fullName || !email || !phone || !province || !roleInterest || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    let submissionId = ''
    try {
      const db = getAdminDb()
      const ref = db.collection('partyInterestSubmissions').doc()
      const now = new Date()
      const payload = {
        id: ref.id,
        fullName,
        email,
        phone,
        province,
        district: district || undefined,
        roleInterest,
        message,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      }
      await ref.set(payload)
      submissionId = ref.id
    } catch (adminError) {
      console.warn('Admin SDK create failed, using client SDK fallback:', adminError)
      submissionId = await createPartyInterestSubmission({
        fullName,
        email,
        phone,
        province,
        district: district || undefined,
        roleInterest,
        message,
      })
    }

    const recipients = await getAdminRecipients()
    if (recipients.length > 0 && process.env.RESEND_API_KEY) {
      const subject = `New Political Party Interest: ${fullName}`
      const bodyText = [
        'A new Political Party interest submission has been received.',
        '',
        `Reference ID: ${submissionId}`,
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Province: ${province}`,
        `District: ${district || '-'}`,
        `Role Interest: ${roleInterest}`,
        '',
        'Message:',
        message,
      ].join('\n')

      for (const recipient of recipients) {
        const result = await sendCustomEmail({
          to: recipient,
          name: 'Admin',
          subject,
          body: bodyText,
          usePlatformTemplate: true,
        })

        await createEmailLog({
          type: 'custom',
          to: recipient,
          name: 'Admin',
          subject,
          status: result.success ? 'sent' : 'failed',
          resendId: result.id,
          error: result.success ? undefined : String(result.error || 'Failed to send'),
          userId: undefined,
        })
      }
    }

    return NextResponse.json({ success: true, id: submissionId }, { status: 200 })
  } catch (error: any) {
    console.error('Error creating party interest submission:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to submit party interest form.' },
      { status: 500 }
    )
  }
}
