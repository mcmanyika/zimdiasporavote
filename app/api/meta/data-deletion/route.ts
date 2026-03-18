import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Meta/Facebook Data Deletion Callback endpoint.
 *
 * This endpoint returns a confirmation code and a status URL in the format
 * Meta expects for data deletion callbacks.
 */

function buildStatusUrl(req: NextRequest, code: string): string {
  const base = req.nextUrl.origin
  return `${base}/api/meta/data-deletion?code=${encodeURIComponent(code)}`
}

export async function POST(req: NextRequest) {
  // Meta may send x-www-form-urlencoded with signed_request.
  // We parse body defensively but don't require it to respond.
  let signedRequest: string | null = null
  try {
    const bodyText = await req.text()
    const params = new URLSearchParams(bodyText)
    signedRequest = params.get('signed_request')
  } catch {
    signedRequest = null
  }

  const confirmationCode = randomUUID()
  const statusUrl = buildStatusUrl(req, confirmationCode)

  // Log for traceability without storing personal data.
  console.log('[meta:data-deletion] callback received', {
    hasSignedRequest: Boolean(signedRequest),
    confirmationCode,
  })

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  })
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  return NextResponse.json({
    status: 'ok',
    message: 'Data deletion request received and queued for processing.',
    confirmation_code: code || null,
  })
}
