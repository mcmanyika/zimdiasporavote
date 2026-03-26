import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase()
}

async function suppressEmail(email: string) {
  const normalized = normalizeEmail(email)
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, error: 'Valid email is required.' }
  }

  const adminDb = getAdminDb()
  const now = new Date()

  await adminDb.collection('emailSuppressions').doc(normalized).set(
    {
      id: normalized,
      email: normalized,
      active: true,
      reason: 'unsubscribe',
      source: 'self_service',
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  )

  await adminDb
    .collection('newsletterSubscriptions')
    .where('email', '==', normalized)
    .get()
    .then(async (snapshot: any) => {
      const updates = snapshot.docs.map((docSnap: any) =>
        docSnap.ref.set(
          {
            subscribed: false,
            updatedAt: now,
          },
          { merge: true }
        )
      )
      await Promise.all(updates)
    })

  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body?.email || '')
    const result = await suppressEmail(email)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Unsubscribe POST failed:', error)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const email = normalizeEmail(request.nextUrl.searchParams.get('email') || '')
    const result = await suppressEmail(email)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: 'Email unsubscribed successfully.' }, { status: 200 })
  } catch (error: any) {
    console.error('Unsubscribe GET failed:', error)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}
