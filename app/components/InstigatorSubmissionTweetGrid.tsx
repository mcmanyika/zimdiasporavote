'use client'

import { useEffect, useRef } from 'react'
import type { ViolenceInstigatorSubmission } from '@/types'

export default function InstigatorSubmissionTweetGrid({
  submissions,
}: {
  submissions: ViolenceInstigatorSubmission[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!submissions.length) return

    const loadWidgets = () => {
      if ((window as any).twttr?.widgets && containerRef.current) {
        ;(window as any).twttr.widgets.load(containerRef.current)
      }
    }

    const scriptId = 'twitter-widgets-js'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      document.body.appendChild(script)
      script.onload = loadWidgets
    } else {
      setTimeout(loadWidgets, 200)
    }
  }, [submissions])

  if (!submissions.length) return null

  return (
    <div ref={containerRef} className="grid gap-8 lg:grid-cols-2">
      {submissions.map((s) => (
        <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">{s.category}</p>
          <blockquote className="twitter-tweet" data-media-max-width="560">
            <a href={s.tweetUrl}>View on X</a>
          </blockquote>
        </div>
      ))}
    </div>
  )
}
