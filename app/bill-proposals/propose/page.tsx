'use client'

import { useState } from 'react'
import Link from 'next/link'
import PartyLinkedDashboardShell from '@/app/components/PartyLinkedDashboardShell'
import { useAuth } from '@/contexts/AuthContext'
import {
  BILL_PROPOSAL_SECTORS,
  DEFAULT_BILL_PROPOSAL_SECTOR,
  type BillProposalSector,
} from '@/lib/bill-proposal-sectors'

export default function ProposeBillPage() {
  const { user, userProfile } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    problem: '',
    solution: '',
    legalBasis: '',
    category: DEFAULT_BILL_PROPOSAL_SECTOR,
    proposerName: userProfile?.name || user?.displayName || '',
    proposerEmail: user?.email || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessId('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/bill-proposals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          summary: formData.summary,
          problem: formData.problem,
          solution: formData.solution,
          legalBasis: formData.legalBasis,
          category: formData.category,
          proposerName: formData.proposerName,
          proposerEmail: formData.proposerEmail,
          proposerUserId: user?.uid || '',
        }),
      })
      const json = await response.json()
      if (!response.ok || !json?.id) {
        throw new Error(json?.error || 'Failed to submit proposal.')
      }
      const id = json.id as string

      setSuccessId(id)
      setFormData((prev) => ({
        ...prev,
        title: '',
        summary: '',
        problem: '',
        solution: '',
        legalBasis: '',
      }))
    } catch (err: any) {
      setError(err?.message || 'Failed to submit proposal.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PartyLinkedDashboardShell
      title="Submit a Bill Proposal"
      breadcrumbLabel="Submit proposal"
      headerDescription="Citizen legislative intake — share the law reform you want reviewed by the Diaspora Vote legislative team."
      maxWidthClass="max-w-4xl"
    >
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {successId ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Proposal submitted successfully and moved to review queue. Reference ID: <span className="font-semibold">{successId}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSuccessId('')}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    Submit Another
                  </button>
                  <Link href="/bill-proposals" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                    View published proposals
                  </Link>
                </div>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Proposal Title">
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  placeholder="e.g. Public Procurement Transparency Bill"
                />
              </Field>

              <Field label="Summary">
                <textarea
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  className="min-h-[90px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  placeholder="Briefly summarize what the bill does."
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Problem Statement">
                  <textarea
                    required
                    value={formData.problem}
                    onChange={(e) => setFormData((prev) => ({ ...prev, problem: e.target.value }))}
                    className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </Field>
                <Field label="Proposed Solution">
                  <textarea
                    required
                    value={formData.solution}
                    onChange={(e) => setFormData((prev) => ({ ...prev, solution: e.target.value }))}
                    className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Legal Basis (optional)">
                  <input
                    value={formData.legalBasis}
                    onChange={(e) => setFormData((prev) => ({ ...prev, legalBasis: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    placeholder="Constitution section, statute, or case law"
                  />
                </Field>
                <Field label="Industry / sector">
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as BillProposalSector,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900"
                  >
                    {BILL_PROPOSAL_SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Your Name">
                  <input
                    required
                    value={formData.proposerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, proposerName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </Field>
                <Field label="Your Email">
                  <input
                    required
                    type="email"
                    value={formData.proposerEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, proposerEmail: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
                <Link href="/bill-proposals" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  View published proposals
                </Link>
              </div>
            </form>
            )}
      </section>
    </PartyLinkedDashboardShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-800">{label}</span>
      {children}
    </label>
  )
}
