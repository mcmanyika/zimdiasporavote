import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import {
  isViolenceInstigatorCategory,
  isValidInstigatorTweetUrl,
  normalizeInstigatorTweetUrl,
} from '@/lib/violence-instigator-submissions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let tweetUrl = String(body?.tweetUrl || '').trim()
    const category = String(body?.category || '').trim()

    if (!tweetUrl || !category) {
      return NextResponse.json({ error: 'Tweet URL and category are required.' }, { status: 400 })
    }

    if (!isViolenceInstigatorCategory(category)) {
      return NextResponse.json({ error: 'Choose a valid category.' }, { status: 400 })
    }

    if (!isValidInstigatorTweetUrl(tweetUrl)) {
      return NextResponse.json(
        { error: 'Please use a full Twitter or X post URL (https://twitter.com/... or https://x.com/...).' },
        { status: 400 }
      )
    }

    tweetUrl = normalizeInstigatorTweetUrl(tweetUrl)

    const db = getAdminDb()
    const ref = db.collection('violenceInstigatorSubmissions').doc()
    const now = new Date()

    await ref.set({
      id: ref.id,
      tweetUrl,
      category,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, id: ref.id }, { status: 200 })
  } catch (error: any) {
    console.error('violence-instigator-submissions submit:', error)
    const message = error?.message || 'Failed to submit.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
