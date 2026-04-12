'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { useAuth } from '@/contexts/AuthContext'
import {
  deleteViolenceInstigatorSubmission,
  getViolenceInstigatorSubmissions,
  updateViolenceInstigatorSubmission,
} from '@/lib/firebase/firestore'
import {
  VIOLENCE_INSTIGATOR_CATEGORIES,
  isViolenceInstigatorCategory,
  isValidInstigatorTweetUrl,
  normalizeInstigatorTweetUrl,
} from '@/lib/violence-instigator-submissions'
import type { ViolenceInstigatorSubmission, ViolenceInstigatorSubmissionStatus } from '@/types'

function formatDate(date: Date | any): string {
  if (!date) return '—'
  const d = date?.toDate?.() || new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<ViolenceInstigatorSubmissionStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  rejected: 'Rejected',
}

export default function AdminViolenceInstigatorSubmissionsPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Violence posts (X links)</h1>
                <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  ← Back to Dashboard
                </Link>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Public submissions await review. Activate to show on{' '}
                <Link href="/report-violence-posts" className="font-medium text-blue-700 hover:underline">
                  /report-violence-posts
                </Link>
                .
              </p>
            </div>
          </div>
          <DashboardNav breadcrumbLabel="Violence posts" />
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <ViolenceSubmissionsTable />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function ViolenceSubmissionsTable() {
  const { user } = useAuth()
  const [rows, setRows] = useState<ViolenceInstigatorSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ViolenceInstigatorSubmissionStatus | 'all'>('all')
  const [editingNote, setEditingNote] = useState<{ id: string; note: string; category: string; url: string } | null>(
    null
  )

  async function load() {
    setLoading(true)
    try {
      const data = await getViolenceInstigatorSubmissions()
      setRows(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered =
    filter === 'all' ? rows : rows.filter((r) => r.status === filter)

  async function setStatus(id: string, status: ViolenceInstigatorSubmissionStatus) {
    setBusyId(id)
    try {
      await updateViolenceInstigatorSubmission(id, {
        status,
        reviewedBy: user?.uid,
      })
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  async function saveEdit() {
    if (!editingNote) return
    const url = editingNote.url.trim()
    if (!isValidInstigatorTweetUrl(url)) {
      alert('Please enter a valid Twitter/X URL.')
      return
    }
    if (!isViolenceInstigatorCategory(editingNote.category)) {
      alert('Invalid category.')
      return
    }
    setBusyId(editingNote.id)
    try {
      await updateViolenceInstigatorSubmission(editingNote.id, {
        tweetUrl: normalizeInstigatorTweetUrl(url),
        category: editingNote.category,
        reviewNote: editingNote.note.trim() || undefined,
        reviewedBy: user?.uid,
      })
      setEditingNote(null)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this submission permanently?')) return
    setBusyId(id)
    try {
      await deleteViolenceInstigatorSubmission(id)
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Filter:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          No submissions in this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">URL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : row.status === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{row.category}</td>
                  <td className="max-w-xs px-4 py-3">
                    <a
                      href={row.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-blue-600 hover:underline"
                    >
                      {row.tweetUrl.length > 72 ? `${row.tweetUrl.slice(0, 72)}…` : row.tweetUrl}
                    </a>
                    {row.reviewNote && (
                      <p className="mt-1 text-xs text-slate-500">Note: {row.reviewNote}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{formatDate(row.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {row.status !== 'active' && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void setStatus(row.id, 'active')}
                          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                      {row.status !== 'pending' && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void setStatus(row.id, 'pending')}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Pending
                        </button>
                      )}
                      {row.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void setStatus(row.id, 'rejected')}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() =>
                          setEditingNote({
                            id: row.id,
                            note: row.reviewNote || '',
                            category: row.category,
                            url: row.tweetUrl,
                          })
                        }
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void handleDelete(row.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Edit submission</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">URL</label>
                <input
                  value={editingNote.url}
                  onChange={(e) => setEditingNote({ ...editingNote, url: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Category</label>
                <select
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {VIOLENCE_INSTIGATOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Internal note (optional)</label>
                <textarea
                  value={editingNote.note}
                  onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
                  className="min-h-[80px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Visible only in admin"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === editingNote.id}
                onClick={() => void saveEdit()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
