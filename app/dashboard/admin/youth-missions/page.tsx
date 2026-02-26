'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { useAuth } from '@/contexts/AuthContext'
import {
  createYouthMission,
  deleteYouthMission,
  getYouthMissions,
  updateYouthMission,
} from '@/lib/firebase/firestore'
import type { YouthMission, YouthMissionCategory } from '@/types'

const CATEGORY_OPTIONS: { value: YouthMissionCategory; label: string }[] = [
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'mobilization', label: 'Mobilization' },
  { value: 'digital_advocacy', label: 'Digital Advocacy' },
  { value: 'community_service', label: 'Community Service' },
  { value: 'leadership', label: 'Leadership' },
]

function formatDate(date?: Date | any): string {
  if (!date) return '-'
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

function AdminYouthMissionsContent() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<YouthMission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<YouthMission | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<YouthMissionCategory>('civic_education')
  const [points, setPoints] = useState('10')
  const [estimatedMinutes, setEstimatedMinutes] = useState('20')
  const [isActive, setIsActive] = useState(true)
  const [dueDate, setDueDate] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('civic_education')
    setPoints('10')
    setEstimatedMinutes('20')
    setIsActive(true)
    setDueDate('')
    setEditing(null)
  }

  const loadMissions = async () => {
    try {
      setLoading(true)
      const data = await getYouthMissions(false)
      setMissions(data)
    } catch (err: any) {
      console.error('Error loading youth missions:', err)
      setError(err.message || 'Failed to load missions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMissions()
  }, [])

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (mission: YouthMission) => {
    setEditing(mission)
    setTitle(mission.title)
    setDescription(mission.description)
    setCategory(mission.category)
    setPoints(String(mission.points))
    setEstimatedMinutes(String(mission.estimatedMinutes))
    setIsActive(mission.isActive)
    setDueDate(
      mission.dueDate ? new Date(mission.dueDate instanceof Date ? mission.dueDate : (mission.dueDate as any)).toISOString().split('T')[0] : ''
    )
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!user) return
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }

    const parsedPoints = Number(points)
    const parsedMinutes = Number(estimatedMinutes)
    if (!Number.isFinite(parsedPoints) || parsedPoints <= 0) {
      setError('Points must be a positive number.')
      return
    }
    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      setError('Estimated minutes must be a positive number.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        points: parsedPoints,
        estimatedMinutes: parsedMinutes,
        isActive,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: user.uid,
      }
      if (editing) {
        await updateYouthMission(editing.id, payload)
      } else {
        await createYouthMission(payload)
      }
      setShowForm(false)
      resetForm()
      await loadMissions()
    } catch (err: any) {
      console.error('Error saving mission:', err)
      setError(err.message || 'Failed to save mission')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (missionId: string) => {
    if (!confirm('Delete this youth mission?')) return
    try {
      await deleteYouthMission(missionId)
      await loadMissions()
    } catch (err: any) {
      setError(err.message || 'Failed to delete mission')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Youth Missions</h1>
            <p className="mt-1 text-sm text-slate-500">Create and manage action tasks for youth participation.</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New Mission
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {showForm && (
          <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Edit Mission' : 'Create Mission'}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as YouthMissionCategory)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Points</label>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Minutes</label>
                <input
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Active mission
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Mission'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent" />
            </div>
          ) : missions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No youth missions created yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {missions.map((mission) => (
                    <tr key={mission.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{mission.title}</p>
                        <p className="text-xs text-slate-500">{mission.description}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {CATEGORY_OPTIONS.find((c) => c.value === mission.category)?.label || mission.category}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{mission.points}</td>
                      <td className="px-4 py-3 text-slate-600">{mission.estimatedMinutes} mins</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(mission.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            mission.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {mission.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(mission)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(mission.id)}
                            className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
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
        </div>
      </div>
    </div>
  )
}

export default function AdminYouthMissionsPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <AdminYouthMissionsContent />
      </AdminRoute>
    </ProtectedRoute>
  )
}
