'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import RichTextEditor from '@/app/components/RichTextEditor'
import { uploadFile } from '@/lib/firebase/storage'
import { getPetitions } from '@/lib/firebase/firestore'

type SendMode = 'single' | 'bulk'
type EmailTemplateId = 'blank_default' | 'blank_alt' | 'petition_followup'

interface ParsedRecipient {
  email: string
  name: string
}

interface EmailTemplate {
  id: EmailTemplateId
  label: string
  subject: string
  htmlBody: string
}

function parseBulkRecipients(input: string): ParsedRecipient[] {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const recipients: ParsedRecipient[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    // Supported formats:
    // 1) name,email@example.com
    // 2) email@example.com
    const parts = line.split(',').map((p) => p.trim()).filter(Boolean)
    let email = ''
    let name = 'Recipient'

    if (parts.length >= 2) {
      name = parts[0] || 'Recipient'
      email = parts[1] || ''
    } else {
      email = parts[0] || ''
    }

    if (!email || !email.includes('@')) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    recipients.push({ email, name })
  }

  return recipients
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'blank_default',
    label: 'Blank Template',
    subject: '',
    htmlBody:
      '<p>Dear [Name],</p><p>Join us by spreading the petition to ALL Zimbabweans, here at home and across the world.</p><p><a href="https://dcpzim.com/petitions">https://dcpzim.com/petitions</a></p>',
  },
  {
    id: 'blank_alt',
    label: 'Blank Template (Alt)',
    subject: '',
    htmlBody:
      '<p>Dear [Name],</p><p><br /></p><p>Join us by spreading the petition to ALL Zimbabweans, here at home and across the world.</p><p><a href="https://dcpzim.com/petitions">https://dcpzim.com/petitions</a></p>',
  },
  {
    id: 'petition_followup',
    label: 'Petition Follow-up',
    subject: 'Thank you for signing the petition',
    htmlBody:
      '<p>Thank you for signing the petition.</p><p>Your support strengthens constitutional democracy.</p>',
  },
]

function ComposeEmailContent() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sendMode, setSendMode] = useState<SendMode>('single')
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateId>('blank_default')
  const [to, setTo] = useState('')
  const [name, setName] = useState('')
  const [bulkRecipients, setBulkRecipients] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loadingPetitionSigners, setLoadingPetitionSigners] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bulkDone, setBulkDone] = useState<{ sent: number; failed: number; total: number } | null>(null)
  const [bulkLoadMsg, setBulkLoadMsg] = useState('')
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

  const applyTemplate = (templateId: EmailTemplateId) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    setSelectedTemplateId(templateId)
    setSubject(tpl.subject)
    setBody(tpl.htmlBody)
    setSuccess(false)
    setBulkDone(null)
    setError('')
  }

  const handleSend = async () => {
    setError('')
    setSuccess(false)
    setBulkDone(null)

    const htmlToPlainText = (html: string) => {
      const temp = document.createElement('div')
      temp.innerHTML = html
      return (temp.textContent || temp.innerText || '').trim()
    }

    const plainBody = htmlToPlainText(body)
    const hasInlineImage = /<img\b/i.test(body)

    const parsedRecipients = sendMode === 'bulk' ? parseBulkRecipients(bulkRecipients) : []

    if (sendMode === 'single' && !to.trim()) return setError('Recipient email is required.')
    if (sendMode === 'bulk' && parsedRecipients.length === 0) {
      return setError('Please add at least one valid recipient.')
    }
    if (!subject.trim()) return setError('Subject is required.')
    if (!plainBody && !hasInlineImage) return setError('Message body is required.')

    try {
      setSending(true)
      const isBlankTemplate = selectedTemplateId === 'blank_default' || selectedTemplateId === 'blank_alt'

      if (sendMode === 'single') {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: to.trim(),
            name: name.trim() || 'Recipient',
            subject: subject.trim(),
            body: plainBody || 'Image content',
            htmlBody: body,
            userId: userProfile?.uid,
            usePlatformTemplate: !isBlankTemplate,
          }),
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Failed to send email.')
          return
        }
        setSuccess(true)
        setTo('')
        setName('')
        setSubject('')
        setBody('')
      } else {
        const total = parsedRecipients.length
        let sent = 0
        let failed = 0

        for (const recipient of parsedRecipients) {
          try {
            const res = await fetch('/api/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: recipient.email,
                name: recipient.name || 'Recipient',
                subject: subject.trim(),
                body: plainBody || 'Image content',
                htmlBody: body,
                userId: userProfile?.uid,
                usePlatformTemplate: !isBlankTemplate,
              }),
            })
            const data = await res.json()
            if (res.ok && data.success) sent++
            else failed++
          } catch {
            failed++
          }
          setBulkDone({ sent, failed, total })
        }

        if (sent > 0) setSuccess(true)
        if (failed > 0 && sent === 0) setError('No emails were sent. Please check recipients or try again.')

        setBulkRecipients('')
        if (sent > 0) {
          setSubject('')
          setBody('')
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setError('')
    setUploadingImage(true)
    try {
      const uploadedTags: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`"${file.name}" is not an image file.`)
        }
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 8MB limit.`)
        }
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `email-images/${timestamp}-${safeName}`
        const url = await uploadFile(file, path)
        uploadedTags.push(
          `<p style="text-align:center;"><img src="${url}" alt="${safeName}" style="display:inline-block;width:100%;max-width:420px;height:auto;border-radius:8px;" /></p>`
        )
      }

      setBody((prev) => `${prev}${prev ? '<br />' : ''}${uploadedTags.join('')}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleLoadPetitionSigners = async () => {
    setError('')
    setBulkLoadMsg('')
    setSuccess(false)
    setBulkDone(null)
    try {
      setLoadingPetitionSigners(true)
      const petitions = await getPetitions(false, false)
      const seen = new Set<string>()
      const recipients: ParsedRecipient[] = []

      for (const petition of petitions) {
        for (const sig of petition.signatures || []) {
          const email = (sig.email || '').trim()
          if (!email) continue
          const key = email.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          recipients.push({
            email,
            name: sig.anonymous ? 'Supporter' : (sig.name || 'Supporter'),
          })
        }
      }

      if (recipients.length === 0) {
        setBulkLoadMsg('No petition signers with email were found.')
        return
      }

      const lines = recipients.map((r) => `${r.name},${r.email}`).join('\n')
      setSendMode('bulk')
      setBulkRecipients(lines)
      setBulkLoadMsg(`Loaded ${recipients.length} unique petition signer email${recipients.length !== 1 ? 's' : ''}.`)
    } catch (err: any) {
      setError(err?.message || 'Failed to load petition signers.')
    } finally {
      setLoadingPetitionSigners(false)
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
        {bulkDone && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">
              Bulk send result: <span className="font-semibold text-emerald-700">{bulkDone.sent} sent</span>,{' '}
              <span className="font-semibold text-red-600">{bulkDone.failed} failed</span> (total {bulkDone.total})
            </p>
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
          {/* Send mode */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Send Mode
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setSendMode('single')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sendMode === 'single' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setSendMode('bulk')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    sendMode === 'bulk' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Bulk
                </button>
              </div>
              <button
                type="button"
                onClick={handleLoadPetitionSigners}
                disabled={loadingPetitionSigners}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingPetitionSigners ? 'Loading signers...' : 'Load Petition Signers'}
              </button>
            </div>
            {bulkLoadMsg && (
              <p className="mt-2 text-xs font-medium text-slate-600">{bulkLoadMsg}</p>
            )}
          </div>

          {/* To */}
          {sendMode === 'single' ? (
            <>
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
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recipients <span className="text-red-400">*</span>
              </label>
              <textarea
                value={bulkRecipients}
                onChange={(e) => setBulkRecipients(e.target.value)}
                placeholder={'one per line:\nJohn Doe,john@example.com\njane@example.com'}
                rows={7}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Use one recipient per line. Format: <code>name,email</code> or <code>email</code>.
              </p>
            </div>
          )}

          {/* Template picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email Template
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value as EmailTemplateId)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                {EMAIL_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => applyTemplate(selectedTemplateId)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Apply Template
              </button>
            </div>
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
            <div className="mt-3 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? 'Uploading image...' : 'Upload Image'}
              </label>
              <span className="text-xs text-slate-500">
                Uploaded images are embedded into the email body.
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            onClick={() => {
              setTo('')
              setName('')
              setBulkRecipients('')
              setSubject('')
              setBody('')
              setSuccess(false)
              setBulkDone(null)
              setError('')
            }}
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
