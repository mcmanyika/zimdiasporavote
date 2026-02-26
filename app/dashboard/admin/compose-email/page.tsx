'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import RichTextEditor from '@/app/components/RichTextEditor'

function ComposeEmailContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [to, setTo] = useState('')
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from search params (e.g. from inbox reply)
  useEffect(() => {
    const paramTo = searchParams.get('to')
    const paramName = searchParams.get('name')
    const paramSubject = searchParams.get('subject')
    if (paramTo) setTo(paramTo)
    if (paramName) setName(paramName)
    if (paramSubject) setSubject(paramSubject)
  }, [searchParams])

  if (!user || userProfile?.role !== 'admin') {
    return null
  }

  const handleSend = async () => {
    setError('')
    setSuccess(false)

    const htmlToPlainText = (html: string) => {
      const temp = document.createElement('div')
      temp.innerHTML = html
      return (temp.textContent || temp.innerText || '').trim()
    }

    const plainBody = htmlToPlainText(body)

    if (!to.trim()) return setError('Recipient email is required.')
    if (!subject.trim()) return setError('Subject is required.')
    if (!plainBody) return setError('Message body is required.')

    try {
      setSending(true)
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: to.trim(),
          name: name.trim() || 'Recipient',
          subject: subject.trim(),
          body: plainBody,
          htmlBody: body,
          userId: userProfile?.uid,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTo('')
        setName('')
        setSubject('')
        setBody('')
      } else {
        setError(data.error || 'Failed to send email.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Compose Email</h1>
        <p className="mt-1 text-sm text-slate-500">Send an email from the platform</p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Success banner */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-800">Email sent successfully!</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <svg className="h-5 w-5 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* To */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              To <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Recipient name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recipient Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message <span className="text-red-400">*</span>
            </label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your message..."
              className="rounded-xl border border-slate-200 bg-slate-50 p-1"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            onClick={() => { setTo(''); setName(''); setSubject(''); setBody(''); setSuccess(false); setError('') }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            Clear
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ComposeEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8"><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" /></div></div>}>
      <ComposeEmailContent />
    </Suspense>
  )
}
