'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getPartyLeadershipNominations, type PartyLeadershipNomination, type PartyPositionType } from '@/features/party'

const positions: { value: PartyPositionType; label: string }[] = [
  { value: 'council', label: 'Council' },
  { value: 'mp', label: 'MP' },
  { value: 'senator', label: 'Senator' },
]

export default function NominatedCandidatesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<PartyPositionType>('council')
  const [candidates, setCandidates] = useState<PartyLeadershipNomination[]>([])

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true)
        setError('')
        const [approved, shortlisted, finalSelected] = await Promise.all([
          getPartyLeadershipNominations({ status: 'approved_for_voting' }),
          getPartyLeadershipNominations({ status: 'shortlisted' }),
          getPartyLeadershipNominations({ status: 'final_selected' }),
        ])
        const merged = [...approved, ...shortlisted, ...finalSelected]
        const deduped = Array.from(new Map(merged.map((item) => [item.id, item])).values())
        setCandidates(deduped)
      } catch (err: any) {
        setError(err?.message || 'Failed to load nominated candidates.')
      } finally {
        setLoading(false)
      }
    }
    void loadCandidates()
  }, [])

  const visibleCandidates = useMemo(() => {
    return candidates
      .filter((item) => item.positionType === selectedPosition)
      .sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0))
  }, [candidates, selectedPosition])

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nominated Candidates</h1>
            <p className="mt-1 text-sm text-slate-600">
              View currently approved candidates by position.
            </p>
          </div>
          <Link href="/party" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to Party Page
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {positions.map((position) => (
              <button
                key={position.value}
                type="button"
                onClick={() => setSelectedPosition(position.value)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  selectedPosition === position.value
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {position.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Loading candidates...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : visibleCandidates.length === 0 ? (
            <p className="text-sm text-slate-600">No nominated candidates published for this position yet.</p>
          ) : (
            <div className="grid gap-3">
              {visibleCandidates.map((candidate) => (
                <article key={candidate.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-lg font-semibold text-slate-900">{candidate.nomineeName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {candidate.province} • {candidate.areaLabel}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    Status: {candidate.status.replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">Votes: {candidate.votesCount || 0}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
