'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getInboundEmails, markInboundEmailRead, markInboundEmailStarred, deleteInboundEmail } from '@/lib/firebase/firestore'
import type { InboundEmail } from '@/types'

const ITEMS_PER_PAGE = 20

function htmlToPlainText(html?: string): string {
  if (!html) return ''
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function getDisplayBody(email: InboundEmail): string {
  const body = (email.body || '').trim()
  if (body) return body
  const htmlText = htmlToPlainText(email.html)
  if (htmlText) return htmlText
  return '(No message body)'
}

export default function AdminInboxPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [emails, setEmails] = useState<InboundEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    if (!user || userProfile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    loadEmails()
  }, [user, userProfile])

  const loadEmails = async () => {
    try {
      setLoading(true)
      const data = await getInboundEmails(500)
      setEmails(data)
    } catch (err) {
      console.error('Error loading inbox:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncMsg('')
      const res = await fetch('/api/email/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncMsg(`Synced ${data.synced} new email${data.synced !== 1 ? 's' : ''}`)
        await loadEmails()
      } else {
        setSyncMsg(data.error || 'Sync failed')
      }
    } catch (err) {
      setSyncMsg('Sync failed')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 4000)
    }
  }

  const handleOpen = async (email: InboundEmail) => {
    setSelectedEmail(email)
    if (!email.isRead) {
      try {
        await markInboundEmailRead(email.id)
        setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, isRead: true } : e))
      } catch (err) {
        console.error('Error marking read:', err)
      }
    }
  }

  const handleStar = async (email: InboundEmail, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await markInboundEmailStarred(email.id, !email.isStarred)
      setEmails((prev) => prev.map((em) => em.id === email.id ? { ...em, isStarred: !em.isStarred } : em))
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...email, isStarred: !email.isStarred })
      }
    } catch (err) {
      console.error('Error toggling star:', err)
    }
  }

  const handleDelete = async (email: InboundEmail) => {
    if (!confirm('Delete this email permanently?')) return
    try {
      await deleteInboundEmail(email.id)
      setEmails((prev) => prev.filter((e) => e.id !== email.id))
      if (selectedEmail?.id === email.id) setSelectedEmail(null)
    } catch (err) {
      console.error('Error deleting email:', err)
    }
  }

  const handleReply = (email: InboundEmail) => {
    router.push(`/dashboard/admin/compose-email?to=${encodeURIComponent(email.from)}&name=${encodeURIComponent(email.fromName || '')}&subject=${encodeURIComponent('Re: ' + email.subject)}`)
  }

  const filtered = emails.filter((e) => {
    const term = search.toLowerCase()
    const matchesSearch =
      e.from.toLowerCase().includes(term) ||
      (e.fromName || '').toLowerCase().includes(term) ||
      e.subject.toLowerCase().includes(term) ||
      getDisplayBody(e).toLowerCase().includes(term)
    if (filter === 'unread') return matchesSearch && !e.isRead
    if (filter === 'starred') return matchesSearch && e.isStarred
    return matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [search, filter])

  const unreadCount = emails.filter((e) => !e.isRead).length
  const starredCount = emails.filter((e) => e.isStarred).length

  const formatDate = (date: Date | any) => {
    try {
      const d = date instanceof Date ? date : date?.toDate?.() || new Date(date)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return '—'
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 min-h-screen bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
            <p className="mt-1 text-sm text-slate-500">Emails received at your domain</p>
          </div>
          <div className="flex items-center gap-3">
            {syncMsg && (
              <span className="text-xs font-medium text-emerald-600">{syncMsg}</span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                  </svg>
                  Sync from Resend
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{emails.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Unread</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{unreadCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Starred</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{starredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        />
        <div className="flex gap-2">
          {(['all', 'unread', 'starred'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Email list + detail */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        {/* List */}
        <div className="space-y-1">
          {paginated.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center">
              <p className="text-sm text-slate-400">No emails found</p>
            </div>
          ) : (
            paginated.map((email) => (
              <div
                key={email.id}
                onClick={() => handleOpen(email)}
                className={`cursor-pointer rounded-xl border px-4 py-3 transition-all ${
                  selectedEmail?.id === email.id
                    ? 'border-slate-900 bg-slate-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm ${!email.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {email.fromName || email.from}
                      </p>
                      {!email.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className={`truncate text-xs ${!email.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                      {email.subject}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {getDisplayBody(email).slice(0, 80)}...
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-[11px] text-slate-400">{formatDate(email.createdAt)}</p>
                    <button
                      onClick={(e) => handleStar(email, e)}
                      className="text-slate-300 hover:text-amber-500 transition-colors"
                    >
                      {email.isStarred ? (
                        <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              <p className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </p>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail pane */}
        <div className="rounded-xl border bg-white shadow-sm">
          {selectedEmail ? (
            <div className="flex h-full flex-col">
              {/* Detail header */}
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="mb-3 flex items-start justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEmail)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">From:</span>
                    <span>{selectedEmail.fromName ? `${selectedEmail.fromName} <${selectedEmail.from}>` : selectedEmail.from}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">To:</span>
                    <span>{selectedEmail.to}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(selectedEmail.createdAt)}</span>
                </div>
              </div>
              {/* Detail body */}
              <div className="flex-1 overflow-auto px-6 py-5">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                  {getDisplayBody(selectedEmail)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <p className="mt-3 text-sm text-slate-400">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
