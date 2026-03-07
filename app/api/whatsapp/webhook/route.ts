import { NextRequest, NextResponse } from 'next/server'
import { processChat } from '@/lib/chat-service'
import { createIncidentReport, getPetitions, signPetition, updateIncidentReport } from '@/lib/firebase/firestore'
import { uploadBufferToStorage } from '@/lib/firebase/admin'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

// In-memory conversation history (for production, use Firestore)
const conversationHistory: Map<string, { role: 'user' | 'assistant'; content: string }[]> = new Map()
const reportModeUsers: Map<string, number> = new Map()
const pendingIncidentReportByUser: Map<string, string> = new Map()

// Maximum history length per conversation
const MAX_HISTORY_LENGTH = 10

function getFriendlyPetitionError(errorMessage: string): string {
  const msg = (errorMessage || '').toLowerCase()
  if (msg.includes('already signed')) {
    return 'This email has already signed the current petition.'
  }
  if (msg.includes('petition not found')) {
    return 'I could not find an active petition to sign right now.'
  }
  return 'I could not complete your petition signature right now.'
}

function getFriendlyWhatsAppApiError(data: any): string {
  const raw = String(data?.error?.message || '').toLowerCase()
  if (raw.includes('error validating access token') || raw.includes('session has expired')) {
    return 'WhatsApp service token expired. Please refresh the Meta access token.'
  }
  if (raw.includes('unsupported post request')) {
    return 'WhatsApp configuration issue: invalid phone number ID or endpoint.'
  }
  if (raw.includes('recipient') || raw.includes('not in allowed list')) {
    return 'Recipient is not enabled for test messaging in Meta.'
  }
  return 'WhatsApp API request failed.'
}

function parseSignCommand(text: string) {
  // Supported formats:
  // 1) Full Name,email@example.com
  // 2) SIGN|Full Name|email@example.com
  // 3) SIGN|petitionId|Full Name|email@example.com [legacy]
  const raw = (text || '').trim()

  // Plain format: "Name,email"
  if (!raw.toUpperCase().startsWith('SIGN|') && raw.includes(',')) {
    const [namePart, emailPart] = raw.split(',', 2).map((p) => p.trim())
    if (namePart && emailPart && emailPart.includes('@')) {
      return {
        petitionId: undefined as string | undefined,
        name: namePart,
        email: emailPart,
        anonymous: false,
      }
    }
  }

  const parts = text.split('|').map((p) => p.trim())
  if (parts.length < 3) return null
  if (parts[0].toUpperCase() !== 'SIGN') return null

  // New simplified format
  if (parts.length === 3) {
    return {
      petitionId: undefined as string | undefined,
      name: parts[1],
      email: parts[2],
      anonymous: false,
    }
  }

  // Legacy format with explicit petitionId
  return {
    petitionId: parts[1],
    name: parts[2],
    email: parts[3],
    anonymous: false,
  }
}

async function getWhatsAppMediaMetadata(mediaId: string): Promise<{
  id: string
  mime_type?: string
  sha256?: string
  file_size?: number
  url?: string
} | null> {
  if (!WHATSAPP_TOKEN || !mediaId) return null

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
    })
    if (!response.ok) return null
    const data = await response.json()
    return {
      id: data.id,
      mime_type: data.mime_type,
      sha256: data.sha256,
      file_size: data.file_size,
      url: data.url,
    }
  } catch (error) {
    console.error('Failed to fetch WhatsApp media metadata:', error)
    return null
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[mimeType.toLowerCase()] || 'jpg'
}

async function downloadWhatsAppMedia(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!WHATSAPP_TOKEN) {
    throw new Error('WhatsApp token is not configured')
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download WhatsApp media (${response.status})`)
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (!contentType.startsWith('image/')) {
    throw new Error('Unsupported media type. Only images are accepted.')
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds maximum size limit (15MB)')
  }

  return { buffer, contentType }
}

/**
 * Webhook verification (GET request from Meta)
 * Meta sends this to verify your webhook URL
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('WhatsApp webhook verification:', { mode, token, challenge: challenge?.substring(0, 20) })

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully!')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('Webhook verification failed')
  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * Receive incoming messages (POST request from Meta)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract message data from Meta's webhook format
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (messages && messages.length > 0) {
      const message = messages[0]
      const from = message.from // Sender's phone number
      const messageType = message.type

      // Only handle text messages for now
      if (messageType === 'text') {
        const text = message.text?.body

        console.log(`WhatsApp message from ${from}: ${text}`)

        const trimmedText = (text || '').trim()
        const upperText = trimmedText.toUpperCase()

        // 0) Reporting mode command
        if (upperText === 'REPORT' || upperText === 'START REPORT') {
          reportModeUsers.set(from, Date.now())
          pendingIncidentReportByUser.delete(from)
          await sendWhatsAppMessage(
            from,
            'Report mode activated.\n\nYou can send details now (location/date/time/description), ' +
              'with or without an image.'
          )
          return NextResponse.json({ success: true })
        }

        // 0.1) If user is in report mode, treat follow-up text as incident details
        if (reportModeUsers.has(from)) {
          const pendingReportId = pendingIncidentReportByUser.get(from)

          if (!pendingReportId) {
            if (!trimmedText) {
              await sendWhatsAppMessage(
                from,
                'Report mode is active. Please send location/date/time/description, or send an image.'
              )
              return NextResponse.json({ success: true })
            }

            try {
              const reportId = await createIncidentReport({
                source: 'whatsapp',
                reporterPhone: from,
                messageId: message.id || undefined,
                description: trimmedText,
                status: 'new',
              })

              await sendWhatsAppMessage(
                from,
                `Thank you. Your incident report has been recorded (Ref: ${reportId}).`
              )
              reportModeUsers.delete(from)
            } catch (createError) {
              console.error('Failed to create text-only incident report:', createError)
              await sendWhatsAppMessage(
                from,
                'I could not save your report details right now. Please try again shortly.'
              )
            }
            return NextResponse.json({ success: true })
          }

          try {
            await updateIncidentReport(pendingReportId, {
              description: trimmedText,
              errorMessage: undefined,
            })
            await sendWhatsAppMessage(
              from,
              `Thank you. Additional details have been added to your report (Ref: ${pendingReportId}).`
            )
            pendingIncidentReportByUser.delete(from)
            reportModeUsers.delete(from)
          } catch (updateError) {
            console.error('Failed to append report details:', updateError)
            await sendWhatsAppMessage(
              from,
              'I could not save these details right now. Please try sending them again shortly.'
            )
          }
          return NextResponse.json({ success: true })
        }

        // 1) Petition helper command: list active petitions with IDs
        if (upperText === 'PETITIONS' || upperText === 'LIST PETITIONS') {
          try {
            const petitions = await getPetitions(true, true)
            if (!petitions.length) {
              await sendWhatsAppMessage(from, 'No active petitions are available at the moment.')
              return NextResponse.json({ success: true })
            }

            const top = petitions.slice(0, 8)
            const lines = top.map((p, i) => `${i + 1}. ${p.title}`)
            const reply =
              `Active petitions:\n\n${lines.join('\n\n')}\n\n` +
              'To sign, send:\nYour Full Name,your@email.com'

            await sendWhatsAppMessage(from, reply)
            return NextResponse.json({ success: true })
          } catch (err) {
            console.error('Error listing petitions on WhatsApp:', err)
            await sendWhatsAppMessage(from, 'Sorry, I could not load petitions right now. Please try again shortly.')
            return NextResponse.json({ success: true })
          }
        }

        // 2) Petition sign command: SIGN|petitionId|name|email|anonymous(optional)
        const signPayload = parseSignCommand(trimmedText)
        if (signPayload) {
          if (!signPayload.name || !signPayload.email || !signPayload.email.includes('@')) {
            await sendWhatsAppMessage(
              from,
              'Invalid sign format.\n\nUse:\nYour Full Name,your@email.com'
            )
            return NextResponse.json({ success: true })
          }

          try {
            let petitionId = signPayload.petitionId
            if (!petitionId) {
              const activePetitions = await getPetitions(true, true)
              if (!activePetitions.length) {
                await sendWhatsAppMessage(from, 'No active petitions are available right now.')
                return NextResponse.json({ success: true })
              }
              // Default to the most recent active petition.
              petitionId = activePetitions[0].id
            }

            await signPetition(petitionId, {
              userId: undefined,
              name: signPayload.name,
              email: signPayload.email,
              anonymous: signPayload.anonymous,
            })

            await sendWhatsAppMessage(
              from,
              `Thank you, ${signPayload.name}. Your petition signature has been recorded successfully.`
            )
            return NextResponse.json({ success: true })
          } catch (err: any) {
            console.error('Error signing petition from WhatsApp:', err)
            const message = err?.message || 'Failed to sign petition'
            const friendly = getFriendlyPetitionError(message)
            await sendWhatsAppMessage(
              from,
              `${friendly}\n\nTip: send PETITIONS to view active petition names.`
            )
            return NextResponse.json({ success: true })
          }
        }

        // Get or initialize conversation history for this user
        let history = conversationHistory.get(from) || []

        // Process the message through the shared chat service
        const result = await processChat(text, history)

        if (result.success && result.response) {
          // Add to conversation history
          history.push({ role: 'user', content: text })
          history.push({ role: 'assistant', content: result.response })

          // Trim history if too long
          if (history.length > MAX_HISTORY_LENGTH * 2) {
            history = history.slice(-MAX_HISTORY_LENGTH * 2)
          }

          conversationHistory.set(from, history)

          // Send response back via WhatsApp
          await sendWhatsAppMessage(from, result.response)
        } else {
          // Send error message
          await sendWhatsAppMessage(
            from,
            'Sorry, I encountered an error. Please try again or visit our website at dcpzim.com for assistance.'
          )
        }
      } else if (messageType === 'image') {
        const image = message.image
        const mediaId = image?.id
        const caption = (image?.caption || '').trim()

        try {
          if (!mediaId) {
            throw new Error('Missing image media ID')
          }

          const mediaMeta = mediaId ? await getWhatsAppMediaMetadata(mediaId) : null
          if (!mediaMeta?.url) {
            throw new Error('Could not resolve WhatsApp image URL')
          }

          // Create the incident report first, then save the image.
          const reportId = await createIncidentReport({
            source: 'whatsapp',
            reporterPhone: from,
            messageId: message.id || undefined,
            whatsappMediaId: mediaId || undefined,
            whatsappMediaUrl: mediaMeta?.url || undefined,
            mediaMimeType: mediaMeta?.mime_type || undefined,
            mediaSha256: mediaMeta?.sha256 || undefined,
            mediaFileSize: mediaMeta?.file_size || undefined,
            mediaUrl: mediaMeta?.url || undefined,
            caption: caption || undefined,
            status: 'new',
          })

          const { buffer, contentType } = await downloadWhatsAppMedia(mediaMeta.url)
          try {
            const extension = getExtensionFromMimeType(contentType)
            const datePrefix = new Date().toISOString().slice(0, 10)
            const storagePath = `incident-reports/${datePrefix}/${Date.now()}-${mediaId}.${extension}`
            const { downloadUrl } = await uploadBufferToStorage(buffer, storagePath, contentType)
            await updateIncidentReport(reportId, {
              mediaUrl: downloadUrl,
              storagePath,
            })
          } catch (uploadError: any) {
            const uploadErrorMessage = uploadError?.message || 'Storage upload failed'
            console.error('Storage upload failed, using WhatsApp media URL fallback:', uploadError)
            await updateIncidentReport(reportId, {
              errorMessage: uploadErrorMessage,
            })
          }

          await sendWhatsAppMessage(
            from,
            `Thank you. Your image report has been received and logged (Ref: ${reportId}).` +
              '\n\nIf safe, reply with location, date/time, and a short description.'
          )
          pendingIncidentReportByUser.set(from, reportId)
        } catch (error: any) {
          console.error('Error saving WhatsApp image report:', error)
          try {
            await createIncidentReport({
              source: 'whatsapp',
              reporterPhone: from,
              messageId: message.id || undefined,
              whatsappMediaId: mediaId || undefined,
              caption: caption || undefined,
              status: 'failed',
              errorMessage: error?.message || 'Failed to store image report',
            })
          } catch (createError) {
            console.error('Failed to store failed incident report record:', createError)
          }
          pendingIncidentReportByUser.delete(from)
          await sendWhatsAppMessage(
            from,
            'We received your image but could not save the report right now. Please try again shortly.'
          )
        }
      } else if (messageType === 'audio' || messageType === 'video') {
        // Handle unsupported media
        await sendWhatsAppMessage(
          from,
          'We currently accept image reports and text only. Please send a photo or type your message.'
        )
      }
    }

    // Always return 200 to Meta to acknowledge receipt
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: true })
  }
}

/**
 * Send a message via WhatsApp API
 */
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials not configured')
    return false
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', {
        friendly: getFriendlyWhatsAppApiError(data),
        code: data?.error?.code,
        type: data?.error?.type,
      })
      return false
    }

    console.log('WhatsApp message sent successfully to:', to)
    return true
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}

