'use client'

import { useState, useEffect, useRef } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import DashboardNav from '@/app/components/DashboardNav'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createResource, getResources, deleteResource, trackDownload } from '@/lib/firebase/firestore'
import { uploadFile, deleteFile } from '@/lib/firebase/storage'
import type { Resource } from '@/types'

export default function ResourcesPage() {
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'admin'
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    setLoading(true)
    try {
      const data = await getResources()
      setResources(data)
    } catch (err) {
      console.error('Error loading resources:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title.trim()) return

    setUploading(true)
    setError('')
    try {
      const storagePath = `resources/${Date.now()}-${selectedFile.name}`
      const fileUrl = await uploadFile(selectedFile, storagePath)

      await createResource({
        title: title.trim(),
        description: description.trim() || undefined,
        fileName: selectedFile.name,
        fileUrl,
        storagePath,
        fileSize: selectedFile.size,
        uploadedBy: userProfile?.uid || '',
        uploadedByName: userProfile?.name || userProfile?.email || '',
      })

      setTitle('')
      setDescription('')
      setSelectedFile(null)
      setShowUploadModal(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadResources()
    } catch (err: any) {
      console.error('Error uploading resource:', err)
      setError(err.message || 'Failed to upload resource')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) return
    setDeleting(resource.id)
    try {
      await deleteFile(resource.storagePath)
    } catch (err) {
      console.warn('Could not delete storage file (may already be removed):', err)
    }
    try {
      await deleteResource(resource.id)
      await loadResources()
    } catch (err) {
      console.error('Error deleting resource:', err)
      alert('Failed to delete resource')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: any): string => {
    if (!date) return '—'
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Resources</h1>
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
          <div className="space-y-6">
            {/* Download Resources Section */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Download Resources</h3>
                  <p className="text-sm text-slate-500">PDFs and documents available for download</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload PDF
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
                </div>
              ) : resources.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-slate-200 py-12 text-center">
                  <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="mt-3 text-sm text-slate-500">No resources uploaded yet.</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-3 text-sm font-semibold text-slate-900 hover:underline"
                    >
                      Upload the first resource
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      {/* PDF Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                          <path d="M8.5 13.5h1c.55 0 1 .15 1.3.45.3.3.45.65.45 1.05s-.15.75-.45 1.05c-.3.3-.75.45-1.3.45h-.5V18h-.5v-4.5zm.5.45v1.6h.5c.35 0 .6-.1.8-.3.2-.2.3-.45.3-.5s-.1-.35-.3-.5c-.2-.2-.45-.3-.8-.3h-.5zm3 .05c.3-.35.7-.5 1.2-.5.55 0 .95.15 1.25.5.3.3.45.75.45 1.25s-.15.95-.45 1.25c-.3.35-.7.5-1.25.5-.5 0-.9-.15-1.2-.5-.3-.3-.45-.75-.45-1.25s.15-.95.45-1.25zm.4.35c-.2.25-.3.55-.3.9s.1.65.3.9c.2.25.45.35.8.35s.6-.1.8-.35c.2-.25.3-.55.3-.9s-.1-.65-.3-.9c-.2-.25-.45-.35-.8-.35s-.6.1-.8.35zM15 13.5h1.3c.4 0 .7.1.9.35.2.2.3.5.3.85v2.6h-.5v-2.6c0-.2-.05-.4-.15-.5-.1-.15-.3-.2-.55-.2H15.5V18H15v-4.5z" />
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{resource.title}</p>
                        {resource.description && (
                          <p className="text-xs text-slate-500 truncate">{resource.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          {resource.fileName} · {formatFileSize(resource.fileSize)} · {formatDate(resource.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackDownload(`resource-${resource.id}`, resource.title)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(resource)}
                            disabled={deleting === resource.id}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                            title="Delete resource"
                          >
                            {deleting === resource.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* External Links */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="https://youtube.com/@DiasporaVote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-2xl">🎥</span>
                  <div>
                    <p className="font-semibold">YouTube Channel</p>
                    <p className="text-sm text-slate-600">Watch our videos</p>
                  </div>
                </Link>
                <Link
                  href="https://diasporavote.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-2xl">🔗</span>
                  <div>
                    <p className="font-semibold">Official Website</p>
                    <p className="text-sm text-slate-600">diasporavote.org</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Upload Resource</h3>
              <button
                onClick={() => { setShowUploadModal(false); setError('') }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Constitutional Rights Guide 2026"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the resource"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  File <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-slate-400 transition-colors"
                >
                  {selectedFile ? (
                    <div>
                      <svg className="mx-auto h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                      </svg>
                      <p className="mt-2 text-sm font-medium text-slate-900">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="mx-auto h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="mt-2 text-sm text-slate-600">Click to select a file</p>
                      <p className="text-xs text-slate-400">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX — up to 20MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile || !title.trim()}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload Resource'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowUploadModal(false); setError('') }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}

