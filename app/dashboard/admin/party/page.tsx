'use client'

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { useAuth } from '@/contexts/AuthContext'
import {
  createPartyEvent,
  deletePartyEvent,
  getPartyEvents,
  getPartyInterestSubmissions,
  getPartyLandingContent,
  updatePartyEvent,
  updatePartyInterestSubmission,
  upsertPartyLandingContent,
} from '@/features/party'
import type { PartyEvent, PartyInterestStatus, PartyInterestSubmission } from '@/features/party'
import { normalizePartyHeroSubtitle } from '@/lib/party-hero-subtitle'
import { normalizePartyHeroTitle, PARTY_HERO_TITLE_DEFAULT } from '@/lib/party-hero-title'

const submissionStatuses: PartyInterestStatus[] = ['new', 'contacted', 'converted', 'archived']
const defaultHeroStats = [
  { label: 'Legislation Passed', value: '1,369' },
  { label: 'Donors', value: '12,000' },
  { label: 'Fund Raised', value: '$85 M' },
  { label: 'Volunteers', value: '30,000' },
]

export default function AdminPartyPage() {
  return (
    <ProtectedRoute>
      <AdminRoute minAccessLevel={5}>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Political Party Module</h1>
                <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
          <DashboardNav />
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
            <PartyContentEditor />
            <PartyEventsManager />
            <PartyInterestManager />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function PartyContentEditor() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    pageTitle: 'NTA Political',
    heroTitle: PARTY_HERO_TITLE_DEFAULT,
    heroSubtitle: '',
    foundingStatement: '',
    mission: '',
    vision: '',
    principlesText: '',
    heroStats: defaultHeroStats.map((item) => ({ ...item })),
    callToActionText: 'Register your interest to join, organize, or support the platform activities.',
    isPublished: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const landing = await getPartyLandingContent()
        if (landing) {
          const heroStats = (landing.heroStats || []).slice(0, 4)
          const normalizedHeroStats = defaultHeroStats.map((fallback, idx) => ({
            label: heroStats[idx]?.label || fallback.label,
            value: heroStats[idx]?.value || fallback.value,
          }))
          const rawPageTitle = (landing.pageTitle || '').trim()
          const pageTitle =
            /^(dcp|wtp|nac)\s*political$/i.test(rawPageTitle)
              ? 'NTA Political'
              : landing.pageTitle || ''
          setFormData({
            pageTitle,
            heroTitle: normalizePartyHeroTitle(landing.heroTitle),
            heroSubtitle: normalizePartyHeroSubtitle(landing.heroSubtitle),
            foundingStatement: landing.foundingStatement || '',
            mission: landing.mission || '',
            vision: landing.vision || '',
            principlesText: (landing.principles || []).join('\n'),
            heroStats: normalizedHeroStats,
            callToActionText: landing.callToActionText || '',
            isPublished: landing.isPublished !== false,
          })
        }
      } catch (error) {
        console.error('Failed to load party content:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const principles = formData.principlesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const heroStats = defaultHeroStats.map((fallback, idx) => ({
        label: formData.heroStats[idx]?.label?.trim() || fallback.label,
        value: formData.heroStats[idx]?.value?.trim() || fallback.value,
      }))

      await upsertPartyLandingContent({
        pageTitle: formData.pageTitle.trim(),
        heroTitle: formData.heroTitle.trim(),
        heroSubtitle: formData.heroSubtitle.trim(),
        foundingStatement: formData.foundingStatement.trim(),
        mission: formData.mission.trim(),
        vision: formData.vision.trim(),
        principles,
        heroStats,
        callToActionText: formData.callToActionText.trim() || undefined,
        isPublished: formData.isPublished,
        updatedBy: user?.uid || undefined,
      })
      setMessage('Landing content updated.')
    } catch (error: any) {
      setMessage(error?.message || 'Failed to save landing content.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'
  const updateHeroStat = (index: number, key: 'label' | 'value', value: string) => {
    setFormData((prev) => {
      const next = prev.heroStats.map((item, idx) =>
        idx === index ? { ...item, [key]: value } : item
      )
      return { ...prev, heroStats: next }
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Landing Content</h2>
      {loading ? (
        <p className="mt-3 text-sm text-slate-600">Loading content...</p>
      ) : (
        <form onSubmit={handleSave} className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Page Title">
            <input value={formData.pageTitle} onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Hero Title">
            <input value={formData.heroTitle} onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Hero Subtitle" className="md:col-span-2">
            <textarea value={formData.heroSubtitle} onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })} className={`${inputClass} min-h-[80px]`} />
          </Field>
          <Field label="Founding Statement" className="md:col-span-2">
            <textarea value={formData.foundingStatement} onChange={(e) => setFormData({ ...formData, foundingStatement: e.target.value })} className={`${inputClass} min-h-[80px]`} />
          </Field>
          <Field label="Mission">
            <textarea value={formData.mission} onChange={(e) => setFormData({ ...formData, mission: e.target.value })} className={`${inputClass} min-h-[80px]`} />
          </Field>
          <Field label="Vision">
            <textarea value={formData.vision} onChange={(e) => setFormData({ ...formData, vision: e.target.value })} className={`${inputClass} min-h-[80px]`} />
          </Field>
          <Field label="Principles (one per line)" className="md:col-span-2">
            <textarea value={formData.principlesText} onChange={(e) => setFormData({ ...formData, principlesText: e.target.value })} className={`${inputClass} min-h-[100px]`} />
          </Field>
          <Field label="Call To Action" className="md:col-span-2">
            <input value={formData.callToActionText} onChange={(e) => setFormData({ ...formData, callToActionText: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Hero Stats" className="md:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {formData.heroStats.map((item, index) => (
                <div key={`hero-stat-${index}`} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Stat {index + 1}</p>
                  <div className="space-y-2">
                    <input
                      value={item.label}
                      onChange={(e) => updateHeroStat(index, 'label', e.target.value)}
                      placeholder="Label"
                      className={inputClass}
                    />
                    <input
                      value={item.value}
                      onChange={(e) => updateHeroStat(index, 'value', e.target.value)}
                      placeholder="Value"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Field>
          <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} />
            Published on public page
          </label>
          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-sm text-slate-600">{message}</p>
            <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function PartyEventsManager() {
  const { user } = useAuth()
  const [items, setItems] = useState<PartyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PartyEvent | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    province: '',
    location: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    registrationUrl: '',
    isPublished: true,
  })

  useEffect(() => {
    void loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await getPartyEvents(false)
      setItems(data)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Failed to load events.')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({
      title: '',
      description: '',
      province: '',
      location: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      registrationUrl: '',
      isPublished: true,
    })
    setShowForm(true)
  }

  const openEdit = (item: PartyEvent) => {
    setEditing(item)
    setFormData({
      title: item.title || '',
      description: item.description || '',
      province: item.province || '',
      location: item.location || '',
      eventDate: toDateInput(item.eventDate),
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      registrationUrl: item.registrationUrl || '',
      isPublished: item.isPublished !== false,
    })
    setShowForm(true)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        province: formData.province.trim(),
        location: formData.location.trim(),
        eventDate: new Date(formData.eventDate),
        startTime: formData.startTime.trim() || undefined,
        endTime: formData.endTime.trim() || undefined,
        registrationUrl: formData.registrationUrl.trim() || undefined,
        isPublished: formData.isPublished,
      }
      if (editing) {
        await updatePartyEvent(editing.id, payload)
      } else {
        await createPartyEvent({ ...payload, createdBy: user?.uid || undefined })
      }
      setShowForm(false)
      setEditing(null)
      await loadItems()
    } catch (err: any) {
      setError(err?.message || 'Failed to save event.')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await deletePartyEvent(id)
      await loadItems()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete event.')
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Party Events</h2>
        <button onClick={openCreate} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          + Add Event
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
          <Field label="Title *"><input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} /></Field>
          <Field label="Province *"><input required value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className={inputClass} /></Field>
          <Field label="Location *"><input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputClass} /></Field>
          <Field label="Date *"><input required type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className={inputClass} /></Field>
          <Field label="Start Time"><input value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className={inputClass} /></Field>
          <Field label="End Time"><input value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className={inputClass} /></Field>
          <Field label="Registration URL" className="md:col-span-2"><input value={formData.registrationUrl} onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })} className={inputClass} /></Field>
          <Field label="Description" className="md:col-span-2"><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} min-h-[90px]`} /></Field>
          <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} />
            Published on public page
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {editing ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading events...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-600">No events created yet.</p>
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{formatDate(item.eventDate)} • {item.location}, {item.province}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.isPublished ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => openEdit(item)} className="rounded border border-slate-300 px-2 py-1 text-xs">Edit</button>
                <button onClick={() => void remove(item.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function PartyInterestManager() {
  const { user } = useAuth()
  const [items, setItems] = useState<PartyInterestSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getPartyInterestSubmissions()
        setItems(data)
        setError('')
      } catch (err: any) {
        setError(err?.message || 'Failed to load submissions.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const updateStatus = async (id: string, status: PartyInterestStatus) => {
    try {
      await updatePartyInterestSubmission(id, { status, reviewedBy: user?.uid || undefined })
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    } catch (err: any) {
      setError(err?.message || 'Failed to update status.')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Interest Submissions</h2>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-600">Loading submissions...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-600">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{item.fullName}</h3>
                <select
                  value={item.status}
                  onChange={(e) => void updateStatus(item.id, e.target.value as PartyInterestStatus)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                >
                  {submissionStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-sm text-slate-700">{item.email} • {item.phone}</p>
              <p className="mt-1 text-sm text-slate-700">{item.province}{item.district ? `, ${item.district}` : ''}</p>
              <p className="mt-1 text-sm text-slate-700"><span className="font-semibold text-slate-900">Role:</span> {item.roleInterest}</p>
              <p className="mt-2 text-sm text-slate-700">{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
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

function formatDate(value: Date | any): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBC'
  return date.toLocaleDateString()
}
