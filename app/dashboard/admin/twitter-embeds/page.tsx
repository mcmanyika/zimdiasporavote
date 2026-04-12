'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  getTwitterEmbeds,
  createTwitterEmbed,
  updateTwitterEmbed,
  deleteTwitterEmbed,
} from '@/lib/firebase/firestore'
import type { TwitterEmbedPost } from '@/types'

function formatDate(date: Date | any): string {
  if (!date) return '—'
  const d = date?.toDate?.() || new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminTwitterEmbedsPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Twitter / X Embeds</h1>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          <DashboardNav />

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <TwitterEmbedsManagement />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function TwitterEmbedsManagement() {
  const { userProfile } = useAuth()
  const [embeds, setEmbeds] = useState<TwitterEmbedPost[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tweetUrl, setTweetUrl] = useState('')
  const [label, setLabel] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadEmbeds()
  }, [])

  async function loadEmbeds() {
    setLoading(true)
    try {
      const data = await getTwitterEmbeds()
      setEmbeds(data)
    } catch (err) {
      console.error('Error loading embeds:', err)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTweetUrl('')
    setLabel('')
    setIsActive(true)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function openCreate() {
    resetForm()
    setIsActive(true)
    setShowForm(true)
  }

  function openEdit(embed: TwitterEmbedPost) {
    setEditingId(embed.id)
    setTweetUrl(embed.tweetUrl)
    setLabel(embed.label || '')
    setIsActive(embed.isActive)
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedUrl = tweetUrl.trim()
    if (!trimmedUrl) {
      setError('Tweet URL is required')
      return
    }

    // Basic URL validation
    if (!trimmedUrl.startsWith('https://twitter.com/') && !trimmedUrl.startsWith('https://x.com/')) {
      setError('Please enter a valid Twitter/X URL (https://twitter.com/... or https://x.com/...)')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateTwitterEmbed(editingId, {
          tweetUrl: trimmedUrl,
          label: label.trim(),
          isActive,
        })
      } else {
        await createTwitterEmbed({
          tweetUrl: trimmedUrl,
          label: label.trim(),
          isActive,
          createdBy: userProfile?.uid || '',
        })
      }
      await loadEmbeds()
      resetForm()
    } catch (err: any) {
      console.error('Error saving embed:', err)
      setError(err.message || 'Failed to save embed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTwitterEmbed(id)
      setDeletingId(null)
      await loadEmbeds()
    } catch (err: any) {
      console.error('Error deleting embed:', err)
    }
  }

  async function handleToggleActive(embed: TwitterEmbedPost) {
    try {
      await updateTwitterEmbed(embed.id, { isActive: !embed.isActive })
      await loadEmbeds()
    } catch (err: any) {
      console.error('Error toggling embed:', err)
    }
  }

  const activeEmbed = embeds.find(e => e.isActive)

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Manage the live Twitter/X embed that appears on the homepage. Only one embed can be active at a time.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Embed
          </button>
        )}
      </div>

      {/* Active embed preview */}
      {activeEmbed && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-bold text-green-800">Currently Live</span>
          </div>
          <p className="text-sm text-green-700 break-all">{activeEmbed.tweetUrl}</p>
          {activeEmbed.label && (
            <p className="text-xs text-green-600 mt-1">{activeEmbed.label}</p>
          )}
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {editingId ? 'Edit Embed' : 'New Twitter/X Embed'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tweet URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://twitter.com/username/status/123456789"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Paste the full URL of the tweet or X Space you want to embed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Label (optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Diaspora Vote Space - Feb 2026"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                A note to help you identify this embed later. Not shown publicly.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600" />
              </label>
              <span className="text-sm font-medium text-slate-700">
                {isActive ? 'Active — shown on homepage' : 'Inactive — not visible'}
              </span>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : editingId ? 'Update Embed' : 'Add Embed'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Embeds list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-6 w-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : embeds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No embeds yet</h3>
          <p className="mt-1 text-sm text-slate-500">Add a Twitter/X embed to show on the homepage.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Embed
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tweet URL</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Label</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {embeds.map((embed) => (
                <tr key={embed.id} className={`hover:bg-slate-50 ${embed.isActive ? 'bg-green-50/40' : ''}`}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {embed.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={embed.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {embed.tweetUrl.length > 60 ? embed.tweetUrl.slice(0, 60) + '…' : embed.tweetUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {embed.label || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {formatDate(embed.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(embed)}
                        title={embed.isActive ? 'Deactivate' : 'Set as Live'}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          embed.isActive
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {embed.isActive ? 'Deactivate' : 'Set Live'}
                      </button>
                      <button
                        onClick={() => openEdit(embed)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      {deletingId === embed.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(embed.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(embed.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
