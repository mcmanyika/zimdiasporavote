'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { useAuth } from '@/contexts/AuthContext'
import { createVideo, deleteVideo, getVideos, updateVideo } from '@/lib/firebase/firestore'
import type { Video, VideoCategory } from '@/types'

function extractYoutubeVideoId(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value
  try {
    const url = new URL(value)
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim()
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
    if (url.hostname.includes('youtube.com')) {
      const paramId = url.searchParams.get('v')?.trim() || ''
      if (/^[a-zA-Z0-9_-]{11}$/.test(paramId)) return paramId
      const pathParts = url.pathname.split('/').filter(Boolean)
      const embedIndex = pathParts.findIndex((part) => part === 'embed' || part === 'shorts')
      if (embedIndex >= 0 && pathParts[embedIndex + 1] && /^[a-zA-Z0-9_-]{11}$/.test(pathParts[embedIndex + 1])) {
        return pathParts[embedIndex + 1]
      }
    }
  } catch {
    return null
  }
  return null
}

function formatDate(date: any): string {
  if (!date) return '—'
  const d = date?.toDate?.() || new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const categories: VideoCategory[] = ['constitution', 'rights', 'governance', 'youth', 'civic_education', 'general']

export default function AdminVideosPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">YouTube Videos</h1>
                <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          <DashboardNav />

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <VideosManagement />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function VideosManagement() {
  const { userProfile } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeInput: '',
    category: 'general' as VideoCategory,
    tags: '',
    durationLabel: '',
    isPublished: true,
    isFeatured: false,
    order: 0,
  })

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    try {
      const data = await getVideos(false)
      setVideos(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load videos')
      console.error('Error loading videos:', err)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      youtubeInput: '',
      category: 'general',
      tags: '',
      durationLabel: '',
      isPublished: true,
      isFeatured: false,
      order: 0,
    })
    setEditingVideo(null)
    setShowForm(false)
    setError('')
  }

  function openCreate() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(video: Video) {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description || '',
      youtubeInput: video.youtubeUrl || video.youtubeVideoId,
      category: video.category || 'general',
      tags: (video.tags || []).join(', '),
      durationLabel: video.durationLabel || '',
      isPublished: video.isPublished,
      isFeatured: video.isFeatured,
      order: video.order || 0,
    })
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const videoId = extractYoutubeVideoId(formData.youtubeInput)
    if (!videoId) {
      setError('Please enter a valid YouTube URL or video ID.')
      return
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      youtubeVideoId: videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      category: formData.category,
      tags: formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      durationLabel: formData.durationLabel.trim() || undefined,
      isPublished: formData.isPublished,
      isFeatured: formData.isFeatured,
      order: Number.isFinite(Number(formData.order)) ? Number(formData.order) : 0,
    }

    if (!payload.title) {
      setError('Title is required.')
      return
    }

    setSaving(true)
    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, payload)
      } else {
        await createVideo({
          ...payload,
          createdBy: userProfile?.uid || userProfile?.email || 'admin',
        })
      }
      await loadVideos()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to save video')
      console.error('Error saving video:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublished(video: Video) {
    try {
      await updateVideo(video.id, { isPublished: !video.isPublished })
      await loadVideos()
    } catch (err) {
      console.error('Error toggling publish:', err)
    }
  }

  async function handleDelete(videoId: string) {
    try {
      await deleteVideo(videoId)
      setDeleteId(null)
      await loadVideos()
    } catch (err: any) {
      setError(err.message || 'Failed to delete video')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Educational Video Library</h2>
          <p className="mt-1 text-sm text-slate-600">Manage YouTube videos shown on the public learning page.</p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            + Add Video
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">{editingVideo ? 'Edit Video' : 'New Video'}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="e.g. Why constitutional term limits matter"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">YouTube URL or Video ID *</label>
              <input
                type="text"
                required
                value={formData.youtubeInput}
                onChange={(e) => setFormData(prev => ({ ...prev, youtubeInput: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="https://www.youtube.com/watch?v=... or youtu.be/... or plain ID"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as VideoCategory }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Duration (optional)</label>
              <input
                type="text"
                value={formData.durationLabel}
                onChange={(e) => setFormData(prev => ({ ...prev, durationLabel: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="e.g. 8 min"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Short context for what viewers will learn."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="constitution, referendum, civic rights"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Order (lower first)</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              Featured
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : editingVideo ? 'Update Video' : 'Create Video'}
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
      )}

      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-300 border-r-transparent" />
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No videos yet. Add the first educational video.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{video.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{video.youtubeVideoId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{video.category.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublished(video)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        video.isPublished ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {video.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{video.order || 0}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{formatDate(video.updatedAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(video)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      {deleteId === video.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteId(video.id)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
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
