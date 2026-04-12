'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import InstigatorSubmissionTweetGrid from '@/app/components/InstigatorSubmissionTweetGrid'
import { getActiveViolenceInstigatorSubmissions } from '@/lib/firebase/firestore'
import { VIOLENCE_INSTIGATOR_CATEGORIES } from '@/lib/violence-instigator-submissions'
import type { ViolenceInstigatorCategory, ViolenceInstigatorSubmission } from '@/types'

export default function ReportViolencePostsPage() {
  const [active, setActive] = useState<ViolenceInstigatorSubmission[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [tweetUrl, setTweetUrl] = useState('')
  const [category, setCategory] = useState<ViolenceInstigatorCategory>(VIOLENCE_INSTIGATOR_CATEGORIES[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getActiveViolenceInstigatorSubmissions()
        if (!cancelled) setActive(data)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [successId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccessId('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/violence-instigator-submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetUrl: tweetUrl.trim(), category }),
      })
      const json = await res.json()
      if (!res.ok || !json?.id) {
        throw new Error(json?.error || 'Submission failed.')
      }
      setSuccessId(json.id as string)
      setTweetUrl('')
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-10 text-white sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Public intake</p>
          <h1 className="text-2xl font-bold sm:text-3xl">Report violence on X</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            Share a link to a post about instigators of violence. Submissions are reviewed before they appear below.
            You do not need an account.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Submit a link</h2>
            <p className="mt-1 text-sm text-slate-600">
              Paste the full URL of the post (e.g. <span className="font-mono text-xs">https://x.com/…</span>).
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800">Post URL *</label>
                <input
                  type="url"
                  required
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/username/status/…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800">Category *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ViolenceInstigatorCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                  {VIOLENCE_INSTIGATOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              {successId && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  Thank you. Your submission was received (reference <span className="font-mono">{successId}</span>). It
                  will be checked by our team before publication.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900">Verified posts</h2>
          <p className="mt-1 text-sm text-slate-600">
            These links have been activated by administrators after review.
          </p>

          {loadingList ? (
            <p className="mt-8 text-center text-slate-600">Loading…</p>
          ) : active.length === 0 ? (
            <p className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">
              No verified posts yet.
            </p>
          ) : (
            <div className="mt-8">
              <InstigatorSubmissionTweetGrid submissions={active} />
            </div>
          )}

          <p className="mt-10 text-center text-sm text-slate-500">
            <Link href="/" className="font-medium text-slate-700 hover:text-slate-900">
              ← Back to home
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
