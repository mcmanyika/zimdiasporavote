import { NextRequest, NextResponse } from 'next/server'
import { sendCustomEmail } from '@/lib/email'
import { createEmailLog } from '@/lib/firebase/firestore'

function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const maybeMessage = (error as any).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, subject, body, htmlBody, userId } = await request.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if ((!body || !body.trim()) && (!htmlBody || !htmlBody.trim())) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim()
    const trimmedName = (name || '').trim() || 'Volunteer'
    const trimmedSubject = subject.trim()
    const trimmedBody = (body || '').trim()
    const trimmedHtmlBody = (htmlBody || '').trim()

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not configured. Skipping email.')

      try {
        await createEmailLog({
          type: 'custom',
          to: trimmedEmail,
          name: trimmedName,
          subject: trimmedSubject,
          status: 'failed',
          error: 'RESEND_API_KEY not configured',
          userId: userId || undefined,
        })
      } catch (logErr) {
        console.error('Failed to log email attempt:', logErr)
      }

      return NextResponse.json(
        { success: false, error: 'Email service not configured.' },
        { status: 500 }
      )
    }

    const result = await sendCustomEmail({
      to: trimmedEmail,
      name: trimmedName,
      subject: trimmedSubject,
      body: trimmedBody,
      htmlBody: trimmedHtmlBody || undefined,
    })

    // Log email
    try {
      const logData: any = {
        type: 'custom',
        to: trimmedEmail,
        name: trimmedName,
        subject: trimmedSubject,
        status: result.success ? 'sent' : 'failed',
      }
      if (result.id) logData.resendId = result.id
      if (!result.success) logData.error = getErrorMessage(result.error)
      if (userId) logData.userId = userId
      await createEmailLog(logData)
    } catch (logErr) {
      console.error('Failed to log email:', logErr)
    }

    if (!result.success) {
      const providerError = getErrorMessage(result.error)
      console.error('Email provider rejected send:', providerError)
      return NextResponse.json(
        { success: false, error: providerError || 'Failed to send email.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Email sent successfully', id: result.id },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in send email route:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
