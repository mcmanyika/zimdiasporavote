'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PartyLinkedDashboardShell from '@/app/components/PartyLinkedDashboardShell'
import { getBillProposals, supportBillProposal } from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { BillProposal } from '@/types'
import { BILL_PROPOSAL_SECTORS } from '@/lib/bill-proposal-sectors'

export default function BillProposalsPage() {
  const [proposals, setProposals] = useState<BillProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string>('all')

  useEffect(() => {
    loadProposals()
  }, [])

  const filteredProposals =
    sectorFilter === 'all' ? proposals : proposals.filter((p) => p.category === sectorFilter)

  const loadProposals = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getBillProposals('published_for_consultation')
      setProposals(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load bill proposals.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PartyLinkedDashboardShell
      title="Bill Proposals"
      breadcrumbLabel="Bill Proposals"
      headerDescription="Review published draft bills and back the ones you want advanced."
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold uppercase tracking-wider text-slate-500">People Power</span>
            {' · '}
            Published proposals open for consultation.
          </p>
          <Link
            href="/bill-proposals/propose"
            className="inline-flex w-fit rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Submit a Bill Proposal
          </Link>
        </div>

        {!loading && proposals.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">Sector:</span>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All sectors</option>
                {BILL_PROPOSAL_SECTORS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-600">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-slate-700">No published bill proposals yet.</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-slate-700">No proposals in this sector yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} onSupported={loadProposals} />
            ))}
          </div>
        )}
      </section>
    </PartyLinkedDashboardShell>
  )
}

function ProposalCard({
  proposal,
  onSupported,
}: {
  proposal: BillProposal
  onSupported: () => Promise<void>
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [expanded, setExpanded] = useState(false)

  const shortSummary =
    proposal.summary.length > 160 ? `${proposal.summary.slice(0, 160).trim()}...` : proposal.summary

  const handleSupport = async () => {
    try {
      setBusy(true)
      setMessage('')

      const email = user?.email || window.prompt('Enter your email to support this bill proposal:')
      if (!email) {
        setMessage('Support cancelled.')
        return
      }

      const result = await supportBillProposal(proposal.id, {
        userId: user?.uid,
        email,
      })

      if (result.supported) {
        setMessage('Support registered. Thank you.')
        await onSupported()
      } else {
        setMessage('You have already supported this proposal.')
      }
    } catch (err: any) {
      setMessage(err?.message || 'Could not record your support.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => setExpanded((prev) => !prev)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setExpanded((prev) => !prev)
        }
      }}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{proposal.category}</span>
        <span className="text-xs text-slate-500">{proposal.supportCount} supports</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900">{proposal.title}</h2>
      <p className="mt-2 text-sm text-slate-700">{expanded ? proposal.summary : shortSummary}</p>
      {!expanded && (
        <p className="mt-3 text-xs font-medium text-slate-500">Click card to view full details</p>
      )}
      {expanded && (
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Problem:</span> {proposal.problem}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Solution:</span> {proposal.solution}
          </p>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Proposed by {proposal.proposerName}</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            void handleSupport()
          }}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving...' : 'Support'}
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-slate-600">{message}</p>}
    </article>
  )
}
