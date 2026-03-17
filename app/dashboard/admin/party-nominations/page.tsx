'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPartyLeadershipNominations,
  getPartyLeadershipVotingConfig,
  upsertPartyLeadershipVotingConfig,
  updatePartyLeadershipNomination,
  type PartyLeadershipNomination,
  type PartyNominationStatus,
} from '@/features/party'

const statuses: PartyNominationStatus[] = [
  'submitted',
  'under_review',
  'approved_for_voting',
  'rejected',
  'shortlisted',
  'final_selected',
  'withdrawn',
]

export default function AdminPartyNominationsPage() {
  return (
    <ProtectedRoute>
      <AdminRoute minAccessLevel={5}>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
              <h1 className="text-3xl font-bold">Party Nominations Management</h1>
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
          <DashboardNav />
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
            <PartyNominationsManager />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function PartyNominationsManager() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [items, setItems] = useState<PartyLeadershipNomination[]>([])
  const [config, setConfig] = useState({
    electionCycle: '2026-primary',
    nominationsOpen: true,
    votingOpen: true,
    maxVotesPerPosition: 1,
  })
  const [statusFilter, setStatusFilter] = useState<'all' | PartyNominationStatus>('all')
  const [nameFilter, setNameFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const cfg = await getPartyLeadershipVotingConfig()
      setConfig({
        electionCycle: cfg.electionCycle,
        nominationsOpen: cfg.nominationsOpen,
        votingOpen: cfg.votingOpen,
        maxVotesPerPosition: cfg.maxVotesPerPosition,
      })
      const data = await getPartyLeadershipNominations({
        electionCycle: cfg.electionCycle,
      })
      setItems(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load nominations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase()
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
      const matchesName = normalizedName
        ? item.nomineeName.toLowerCase().includes(normalizedName) ||
          item.submittedByName.toLowerCase().includes(normalizedName)
        : true
      return matchesStatus && matchesName
    })
  }, [items, statusFilter, nameFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, nameFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.total += 1
        acc.votes += item.votesCount || 0
        return acc
      },
      { total: 0, votes: 0 }
    )
  }, [filteredItems])

  const saveConfig = async () => {
    setSavingConfig(true)
    setError('')
    setMessage('')
    try {
      await upsertPartyLeadershipVotingConfig({
        electionCycle: config.electionCycle.trim(),
        nominationsOpen: config.nominationsOpen,
        votingOpen: config.votingOpen,
        maxVotesPerPosition: Number(config.maxVotesPerPosition) || 1,
        updatedBy: user?.uid,
      })
      setMessage('Voting configuration updated.')
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to update voting config.')
    } finally {
      setSavingConfig(false)
    }
  }

  const updateStatus = async (id: string, status: PartyNominationStatus) => {
    try {
      await updatePartyLeadershipNomination(id, {
        status,
        reviewedBy: user?.uid,
      })
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    } catch (err: any) {
      setError(err?.message || 'Failed to update nomination status.')
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Voting Configuration</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Election Cycle</label>
            <input
              value={config.electionCycle}
              onChange={(e) => setConfig({ ...config, electionCycle: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Max Votes Per Position</label>
            <input
              type="number"
              min={1}
              value={config.maxVotesPerPosition}
              onChange={(e) => setConfig({ ...config, maxVotesPerPosition: Number(e.target.value) || 1 })}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={config.nominationsOpen}
              onChange={(e) => setConfig({ ...config, nominationsOpen: e.target.checked })}
            />
            Nominations Open
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={config.votingOpen}
              onChange={(e) => setConfig({ ...config, votingOpen: e.target.checked })}
            />
            Voting Open
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void saveConfig()}
            disabled={savingConfig}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {savingConfig ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Nominations</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filter by nominee or submitter"
              className={inputClass}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | PartyNominationStatus)}
              className={inputClass}
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Showing {filteredItems.length} nomination(s) • {totals.votes} total vote(s)
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading nominations...</p>
        ) : filteredItems.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No nominations found for this filter.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-2 py-2 font-medium">Nominee</th>
                  <th className="px-2 py-2 font-medium">Position</th>
                  <th className="px-2 py-2 font-medium">Area</th>
                  <th className="px-2 py-2 font-medium">Votes</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <p className="font-medium text-slate-900">{item.nomineeName}</p>
                      <p className="text-xs text-slate-500">{item.submittedByName}</p>
                    </td>
                    <td className="px-2 py-2 uppercase text-slate-700">{item.positionType}</td>
                    <td className="px-2 py-2 text-slate-700">
                      {item.province} • {item.areaLabel}
                    </td>
                    <td className="px-2 py-2 text-slate-700">{item.votesCount || 0}</td>
                    <td className="px-2 py-2">
                      <select
                        value={item.status}
                        onChange={(e) => void updateStatus(item.id, e.target.value as PartyNominationStatus)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
