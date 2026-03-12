import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { createBillProposal } from '@/lib/firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const title = String(body?.title || '').trim()
    const summary = String(body?.summary || '').trim()
    const problem = String(body?.problem || '').trim()
    const solution = String(body?.solution || '').trim()
    const category = String(body?.category || '').trim()
    const proposerName = String(body?.proposerName || '').trim()
    const proposerEmail = String(body?.proposerEmail || '').trim()
    const legalBasisRaw = String(body?.legalBasis || '').trim()
    const proposerUserIdRaw = String(body?.proposerUserId || '').trim()

    if (!title || !summary || !problem || !solution || !category || !proposerName || !proposerEmail) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    if (!proposerEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid proposer email.' }, { status: 400 })
    }

    // First attempt: Admin SDK write (bypasses client security rules).
    try {
      const db = getAdminDb()
      const ref = db.collection('billProposals').doc()
      const now = new Date()

      const payload: Record<string, any> = {
        id: ref.id,
        title,
        summary,
        problem,
        solution,
        category,
        proposerName,
        proposerEmail,
        status: 'under_review',
        supportCount: 0,
        createdAt: now,
        updatedAt: now,
      }

      if (legalBasisRaw) payload.legalBasis = legalBasisRaw
      if (proposerUserIdRaw) payload.proposerUserId = proposerUserIdRaw

      await ref.set(payload)
      return NextResponse.json({ success: true, id: ref.id }, { status: 200 })
    } catch (adminError: any) {
      console.warn('Admin submit failed; attempting client SDK fallback:', adminError?.message || adminError)
    }

    // Fallback: client SDK write (works when rules permit public create).
    const id = await createBillProposal({
      title,
      summary,
      problem,
      solution,
      category,
      proposerName,
      proposerEmail,
      legalBasis: legalBasisRaw || undefined,
      proposerUserId: proposerUserIdRaw || undefined,
    })
    return NextResponse.json({ success: true, id }, { status: 200 })
  } catch (error: any) {
    console.error('Error submitting bill proposal:', error)
    const message = error?.message || 'Failed to submit proposal.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
