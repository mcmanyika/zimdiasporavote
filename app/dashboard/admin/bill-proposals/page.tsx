'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { getBillProposals, updateBillProposal } from '@/lib/firebase/firestore'
import type { BillProposal, BillProposalStatus } from '@/types'

const STATUS_OPTIONS: BillProposalStatus[] = [
  'draft',
  'under_review',
  'needs_revision',
  'published_for_consultation',
  'archived',
]

export default function AdminBillProposalsPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Bill Proposal Management</h1>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          <DashboardNav />

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <BillProposalQueue />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function BillProposalQueue() {
  const [items, setItems] = useState<BillProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')
  const [statusFilter, setStatusFilter] = useState<BillProposalStatus | 'all'>('all')

  useEffect(() => {
    loadItems(statusFilter)
  }, [statusFilter])

  const loadItems = async (status: BillProposalStatus | 'all') => {
    try {
      setLoading(true)
      setError('')
      const data = await getBillProposals(status)
      setItems(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load bill proposals.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: BillProposalStatus) => {
    try {
      setSavingId(id)
      setError('')
      await updateBillProposal(id, { status })
      await loadItems(statusFilter)
    } catch (err: any) {
      setError(err?.message || 'Failed to update proposal.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Review Queue</h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BillProposalStatus | 'all')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-600">
          Loading proposals...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-600">
          No proposals found.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {item.supportCount} supports
                </span>
              </div>

              <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-900">Sector:</span> {item.category}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Submitted by:</span> {item.proposerName} ({item.proposerEmail})
                </p>
                <p className="md:col-span-2">
                  <span className="font-semibold text-slate-900">Problem:</span> {item.problem}
                </p>
                <p className="md:col-span-2">
                  <span className="font-semibold text-slate-900">Solution:</span> {item.solution}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((status) => {
                  const active = item.status === status
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={Boolean(savingId)}
                      onClick={() => handleStatusUpdate(item.id, status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {savingId === item.id ? 'Saving...' : status}
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
