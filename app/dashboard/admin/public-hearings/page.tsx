'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import {
  createPublicHearing,
  deletePublicHearing,
  getPublicHearings,
  updatePublicHearing,
} from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { PublicHearing, PublicHearingStatus } from '@/types'

const statusOptions: PublicHearingStatus[] = ['upcoming', 'today', 'completed', 'cancelled', 'rescheduled']

export default function AdminPublicHearingsPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Public Hearings Management</h1>
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
            <PublicHearingsManagement />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function PublicHearingsManagement() {
  const { user } = useAuth()
  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900'
  const [items, setItems] = useState<PublicHearing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PublicHearing | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    billCode: '',
    teamCode: '',
    province: '',
    district: '',
    locationName: '',
    venue: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    timezone: 'Africa/Harare',
    status: 'upcoming' as PublicHearingStatus,
    isPublished: true,
    sourceUrl: '',
    sourceImageUrl: '',
    notes: '',
  })

  useEffect(() => {
    void loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await getPublicHearings()
      setItems(data)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Failed to load hearings.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      billCode: '',
      teamCode: '',
      province: '',
      district: '',
      locationName: '',
      venue: '',
      scheduledDate: '',
      startTime: '',
      endTime: '',
      timezone: 'Africa/Harare',
      status: 'upcoming',
      isPublished: true,
      sourceUrl: '',
      sourceImageUrl: '',
      notes: '',
    })
  }

  const openCreate = () => {
    setEditing(null)
    resetForm()
    setShowForm(true)
  }

  const openEdit = (item: PublicHearing) => {
    setEditing(item)
    setFormData({
      title: item.title || '',
      billCode: item.billCode || '',
      teamCode: item.teamCode || '',
      province: item.province || '',
      district: item.district || '',
      locationName: item.locationName || '',
      venue: item.venue || '',
      scheduledDate: toDateInput(item.scheduledDate),
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      timezone: item.timezone || 'Africa/Harare',
      status: item.status || 'upcoming',
      isPublished: item.isPublished ?? true,
      sourceUrl: item.sourceUrl || '',
      sourceImageUrl: item.sourceImageUrl || '',
      notes: item.notes || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const payload = {
        title: formData.title.trim(),
        billCode: formData.billCode.trim() || undefined,
        teamCode: formData.teamCode.trim() || undefined,
        province: formData.province.trim(),
        district: formData.district.trim(),
        locationName: formData.locationName.trim() || undefined,
        venue: formData.venue.trim(),
        scheduledDate: new Date(formData.scheduledDate),
        startTime: formData.startTime.trim() || undefined,
        endTime: formData.endTime.trim() || undefined,
        timezone: formData.timezone.trim() || 'Africa/Harare',
        status: formData.status,
        isPublished: formData.isPublished,
        sourceUrl: formData.sourceUrl.trim() || undefined,
        sourceImageUrl: formData.sourceImageUrl.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      }

      if (editing) {
        await updatePublicHearing(editing.id, payload)
      } else {
        await createPublicHearing({
          ...payload,
          createdBy: user?.uid || undefined,
        })
      }

      setShowForm(false)
      setEditing(null)
      resetForm()
      await loadItems()
    } catch (err: any) {
      setError(err?.message || 'Failed to save hearing.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this hearing? This action cannot be undone.')
    if (!confirmed) return
    try {
      await deletePublicHearing(id)
      await loadItems()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete hearing.')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Public Hearings</h2>
          <p className="mt-1 text-sm text-slate-600">Manage upcoming hearings schedule and publication status.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          + Add Hearing
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">{editing ? 'Edit Hearing' : 'Create Hearing'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Field label="Title *">
              <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Bill Code">
              <input value={formData.billCode} onChange={(e) => setFormData({ ...formData, billCode: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Team Code">
              <input value={formData.teamCode} onChange={(e) => setFormData({ ...formData, teamCode: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Province *">
              <input required value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className={inputClass} />
            </Field>
            <Field label="District *">
              <input required value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Place">
              <input value={formData.locationName} onChange={(e) => setFormData({ ...formData, locationName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Venue *">
              <input required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Date *">
              <input type="date" required value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Start Time">
              <input placeholder="e.g. 1000 hrs" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className={inputClass} />
            </Field>
            <Field label="End Time">
              <input value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Status">
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as PublicHearingStatus })} className={inputClass}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Timezone">
              <input value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Source URL">
              <input value={formData.sourceUrl} onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Source Image URL">
              <input value={formData.sourceImageUrl} onChange={(e) => setFormData({ ...formData, sourceImageUrl: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={`${inputClass} min-h-[90px]`} />
            </Field>
            <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} />
              Publish this hearing on the public page
            </label>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {submitting ? 'Saving...' : editing ? 'Update Hearing' : 'Create Hearing'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-10 text-center text-slate-600">Loading hearings...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-600">No hearings found yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600">
                      {item.province} / {item.district} - {item.venue}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button onClick={() => openEdit(item)} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">Edit</button>
                    <button onClick={() => void handleDelete(item.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-800">{label}</span>
      {children}
    </label>
  )
}

function toDateInput(value: Date | any): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}
