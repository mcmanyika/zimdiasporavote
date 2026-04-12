'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getContactSubmissions } from '@/lib/firebase/firestore'
import type { ContactSubmission } from '@/types'

export default function AdminContactsPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  useEffect(() => {
    if (!user || userProfile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadSubmissions()
  }, [user, userProfile])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const data = await getContactSubmissions()
      setSubmissions(data)
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = submissions.filter((s) => {
    const term = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.message.toLowerCase().includes(term)
    )
  })

  const formatDate = (date: Date | any) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
          <p className="text-sm text-slate-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
          <p className="mt-1 text-sm text-slate-500">
            {submissions.length} message{submissions.length !== 1 ? 's' : ''} received
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Messages List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-slate-900">No messages found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? 'Try adjusting your search terms' : 'No contact messages have been received yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((submission) => (
            <div
              key={submission.id}
              onClick={() => setSelectedMessage(selectedMessage?.id === submission.id ? null : submission)}
              className={`rounded-xl border bg-white p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md ${
                selectedMessage?.id === submission.id
                  ? 'border-slate-900 shadow-md ring-1 ring-slate-900'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {submission.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{submission.name}</p>
                    <a
                      href={`mailto:${submission.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {submission.email}
                    </a>
                    {selectedMessage?.id !== submission.id && (
                      <p className="mt-1 text-xs text-slate-500 truncate max-w-md">
                        {submission.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">
                    {formatDate(submission.createdAt)}
                  </p>
                  <svg
                    className={`mt-1 ml-auto h-4 w-4 text-slate-400 transition-transform ${
                      selectedMessage?.id === submission.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded message */}
              {selectedMessage?.id === submission.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {submission.message}
                  </p>
                    <div className="mt-4 flex gap-2">
                    <a
                      href={`mailto:${submission.email}?subject=Re: Your message to Diaspora Vote`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Reply via Email
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(submission.message, submission.id)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {copiedId === submission.id ? (
                        <>
                          <svg className="h-3.5 w-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {submissions.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{submissions.length}</p>
            <p className="text-xs text-slate-500">Total Messages</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {new Set(submissions.map((s) => s.email)).size}
            </p>
            <p className="text-xs text-slate-500">Unique Senders</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-slate-900">
              {submissions.length > 0
                ? formatDate(submissions[0].createdAt).split(',')[0]
                : '—'}
            </p>
            <p className="text-xs text-slate-500">Latest Message</p>
          </div>
        </div>
      )}
    </div>
  )
}
