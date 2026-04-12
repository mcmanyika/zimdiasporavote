'use client'

import { useState, useEffect, useMemo } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { getAllVolunteerApplications, updateVolunteerApplicationStatus, markVolunteerEmailed, markVolunteersEmailedBatch, saveEmailDraft, getEmailDraft, deleteEmailDraft } from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { VolunteerApplication, VolunteerApplicationStatus } from '@/types'
import Link from 'next/link'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#94a3b8',
}
const SKILL_COLORS = ['#0f172a', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

type SortField = 'name' | 'email' | 'submitted' | 'status'
type SortDir = 'asc' | 'desc'

function toDate(date: Date | any): Date | null {
  if (!date) return null
  if (date instanceof Date) return date
  if (date && typeof date === 'object' && 'toDate' in date) {
    return (date as any).toDate()
  }
  return new Date(date as string | number)
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminVolunteersPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Volunteer Applications</h1>
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
            <VolunteerApplicationsManagement />
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

function VolunteerApplicationsManagement() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<VolunteerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<VolunteerApplicationStatus | 'all'>('all')
  const [selectedApplication, setSelectedApplication] = useState<VolunteerApplication | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState<VolunteerApplicationStatus>('approved')
  const [processing, setProcessing] = useState(false)
  const [sortField, setSortField] = useState<SortField>('submitted')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTarget, setEmailTarget] = useState<VolunteerApplication | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailError, setEmailError] = useState('')

  // Bulk email state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false)
  const [bulkEmailSubject, setBulkEmailSubject] = useState('')
  const [bulkEmailBody, setBulkEmailBody] = useState('')
  const [bulkEmailSending, setBulkEmailSending] = useState(false)
  const [bulkEmailProgress, setBulkEmailProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const [bulkEmailDone, setBulkEmailDone] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col leading-none">
      <svg className={`h-2 w-2 ${sortField === field && sortDir === 'asc' ? 'text-slate-900' : 'text-slate-300'}`} viewBox="0 0 8 5" fill="currentColor"><path d="M4 0l4 5H0z" /></svg>
      <svg className={`h-2 w-2 ${sortField === field && sortDir === 'desc' ? 'text-slate-900' : 'text-slate-300'}`} viewBox="0 0 8 5" fill="currentColor"><path d="M4 5L0 0h8z" /></svg>
    </span>
  )

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAllVolunteerApplications()
      setApplications(data)
    } catch (err: any) {
      console.error('Error loading volunteer applications:', err)
      const errorMessage = err.message || 'Failed to load applications'
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        setError('Permission denied. Please ensure your user account has admin role set in Firestore.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (application: VolunteerApplication) => {
    setSelectedApplication(application)
    setReviewNotes(application.notes || '')
    setReviewStatus(application.status === 'pending' ? 'approved' : application.status)
    setShowModal(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedApplication || !user) return

    setProcessing(true)
    try {
      await updateVolunteerApplicationStatus(
        selectedApplication.id,
        reviewStatus,
        user.uid,
        reviewNotes.trim() || undefined
      )
      await loadApplications()
      setShowModal(false)
      setSelectedApplication(null)
      setReviewNotes('')
    } catch (err: any) {
      console.error('Error updating application status:', err)
      alert(err.message || 'Failed to update application status')
    } finally {
      setProcessing(false)
    }
  }

  const openEmailModal = async (app: VolunteerApplication) => {
    setEmailTarget(app)
    setEmailSuccess('')
    setEmailError('')
    setShowEmailModal(true)

    // Try to load existing draft
    try {
      const draft = await getEmailDraft('volunteer', app.id)
      if (draft) {
        setEmailSubject(draft.subject)
        setEmailBody(draft.body)
        return
      }
    } catch (e) { /* ignore */ }

    // No draft — use default template
    setEmailSubject(`Your Volunteer Application — Diaspora Vote`)
    setEmailBody(
      `Thank you for submitting your volunteer application to Diaspora Vote (DV). We truly appreciate your willingness to contribute your time and skills to this important cause.\n\nWe have reviewed your application and are pleased to inform you that we would like to explore how best to engage you within our programmes. A member of our team will be in touch to discuss next steps.\n\nIn the meantime, please feel free to visit our website at diasporavote.org to stay updated on our latest activities and initiatives.\n\nOnce again, thank you for standing with us.`
    )
  }

  const closeEmailModal = async () => {
    // Save draft if there's content
    if (emailTarget && (emailSubject.trim() || emailBody.trim())) {
      try {
        await saveEmailDraft({
          context: 'volunteer',
          targetId: emailTarget.id,
          recipientEmail: emailTarget.email,
          recipientName: emailTarget.name,
          subject: emailSubject,
          body: emailBody,
          createdBy: user?.uid || '',
        })
      } catch (e) { /* non-critical */ }
    }
    setShowEmailModal(false)
    setEmailTarget(null)
  }

  const handleSendEmail = async () => {
    if (!emailTarget || !emailSubject.trim() || !emailBody.trim()) {
      setEmailError('Subject and message are required.')
      return
    }
    setEmailSending(true)
    setEmailError('')
    setEmailSuccess('')
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTarget.email,
          name: emailTarget.name,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          userId: emailTarget.userId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email')
      }
      // Mark as emailed and delete draft
      try {
        await markVolunteerEmailed(emailTarget.id)
        await deleteEmailDraft('volunteer', emailTarget.id)
        await loadApplications()
      } catch (e) { /* non-critical */ }
      setEmailSuccess(`Email sent to ${emailTarget.email}`)
      setTimeout(() => {
        setShowEmailModal(false)
        setEmailTarget(null)
      }, 2000)
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send email')
    } finally {
      setEmailSending(false)
    }
  }

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredApplications = statusFilter === 'all'
    ? applications
    : applications.filter((app) => app.status === statusFilter)

  const sortedApplications = useMemo(() => {
    const arr = [...filteredApplications]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
          break
        case 'email':
          cmp = (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase())
          break
        case 'submitted': {
          const dateA = toDate(a.createdAt)?.getTime() || 0
          const dateB = toDate(b.createdAt)?.getTime() || 0
          cmp = dateA - dateB
          break
        }
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filteredApplications, sortField, sortDir])

  const allSelected = sortedApplications.length > 0 && sortedApplications.every((a) => selectedIds.has(a.id))
  const someSelected = sortedApplications.some((a) => selectedIds.has(a.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedApplications.map((a) => a.id)))
    }
  }

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredApplications.map((a) => a.id)))
  }

  const selectedApps = applications.filter((a) => selectedIds.has(a.id))

  const getDefaultBulkTemplate = () => ({
    subject: 'Your Volunteer Application — Diaspora Vote',
    body: `Thank you for submitting your volunteer application to Diaspora Vote (DV). We truly appreciate your willingness to contribute your time and skills to this important cause.\n\nWe have reviewed your application and are pleased to inform you that we would like to explore how best to engage you within our programmes. A member of our team will be in touch to discuss next steps.\n\nIn the meantime, please feel free to visit our website at diasporavote.org to stay updated on our latest activities and initiatives.\n\nOnce again, thank you for standing with us.`,
  })

  const openBulkEmailModal = () => {
    if (selectedIds.size === 0) return
    const tpl = getDefaultBulkTemplate()
    setBulkEmailSubject(tpl.subject)
    setBulkEmailBody(tpl.body)
    setBulkEmailSending(false)
    setBulkEmailDone(false)
    setBulkEmailProgress({ sent: 0, failed: 0, total: selectedApps.length })
    setShowBulkEmailModal(true)
  }

  const handleBulkSendEmail = async () => {
    if (!bulkEmailSubject.trim() || !bulkEmailBody.trim() || selectedApps.length === 0) return
    setBulkEmailSending(true)
    setBulkEmailDone(false)
    const total = selectedApps.length
    let sent = 0
    let failed = 0
    setBulkEmailProgress({ sent, failed, total })

    const successIds: string[] = []

    for (const app of selectedApps) {
      const personalBody = bulkEmailBody.replace(/\[Name\]/gi, app.name || 'Volunteer')
      const personalSubject = bulkEmailSubject.replace(/\[Name\]/gi, app.name || 'Volunteer')

      try {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: app.email,
            name: app.name,
            subject: personalSubject.trim(),
            body: personalBody.trim(),
            userId: app.userId || undefined,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          sent++
          successIds.push(app.id)
        } else {
          failed++
        }
      } catch {
        failed++
      }
      setBulkEmailProgress({ sent, failed, total })
    }

    if (successIds.length > 0) {
      try {
        await markVolunteersEmailedBatch(successIds)
      } catch (e) { /* non-critical */ }
    }

    setBulkEmailSending(false)
    setBulkEmailDone(true)
    await loadApplications()
  }

  const closeBulkEmailModal = () => {
    setShowBulkEmailModal(false)
    if (bulkEmailDone) {
      setSelectedIds(new Set())
    }
  }

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter])

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((app) => app.status === 'pending').length,
    approved: applications.filter((app) => app.status === 'approved').length,
    rejected: applications.filter((app) => app.status === 'rejected').length,
    withdrawn: applications.filter((app) => app.status === 'withdrawn').length,
  }

  // Chart: Status distribution
  const statusChartData = useMemo(() => {
    return Object.entries(statusCounts)
      .filter(([key]) => key !== 'all')
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name] || '#94a3b8',
        total: applications.length,
      }))
      .filter((d) => d.value > 0)
  }, [applications, statusCounts])

  // Chart: Top skills
  const skillsChartData = useMemo(() => {
    const skillMap: Record<string, number> = {}
    applications.forEach((app) => {
      app.skills.forEach((skill) => {
        skillMap[skill] = (skillMap[skill] || 0) + 1
      })
    })
    return Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], i) => ({
        name,
        value,
        color: SKILL_COLORS[i % SKILL_COLORS.length],
        total: applications.length,
      }))
  }, [applications])

  // Chart: Availability
  const availabilityChartData = useMemo(() => {
    const availMap: Record<string, number> = {}
    applications.forEach((app) => {
      const key = app.availability || 'Unknown'
      availMap[key] = (availMap[key] || 0) + 1
    })
    return Object.entries(availMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: SKILL_COLORS[i % SKILL_COLORS.length],
        total: applications.length,
      }))
      .filter((d) => d.value > 0)
  }, [applications])

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload
      const pct = d.total > 0 ? ((d.value / d.total) * 100).toFixed(1) : '0'
      return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold text-slate-900">{d.name}</p>
          <p className="text-slate-600">{d.value} ({pct}%)</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="text-slate-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Filter by Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VolunteerApplicationStatus | 'all')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="pending">Pending ({statusCounts.pending})</option>
              <option value="approved">Approved ({statusCounts.approved})</option>
              <option value="rejected">Rejected ({statusCounts.rejected})</option>
              <option value="withdrawn">Withdrawn ({statusCounts.withdrawn})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      {applications.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Status Distribution */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Status Distribution</h3>
            <div className="h-48">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {statusChartData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-600">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Skills */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Top Skills</h3>
            <div className="h-48">
              {skillsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {skillsChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {skillsChartData.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-600">{d.name} ({d.value})</span>
                </div>
              ))}
              {skillsChartData.length > 4 && (
                <span className="text-xs text-slate-400">+{skillsChartData.length - 4} more</span>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Availability</h3>
            <div className="h-48">
              {availabilityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={availabilityChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {availabilityChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {availabilityChartData.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-slate-600">{d.name} ({d.value})</span>
                </div>
              ))}
              {availabilityChartData.length > 4 && (
                <span className="text-xs text-slate-400">+{availabilityChartData.length - 4} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-900">
              {selectedIds.size} volunteer{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            {selectedIds.size < filteredApplications.length && (
              <button
                onClick={selectAllFiltered}
                className="text-xs font-medium text-blue-700 hover:text-blue-900 underline"
              >
                Select all {filteredApplications.length} filtered
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={openBulkEmailModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Bulk Email
          </button>
        </div>
      )}

      {/* Applications List */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort('name')}
                >
                  <span className="inline-flex items-center">Name <SortIcon field="name" /></span>
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort('email')}
                >
                  <span className="inline-flex items-center">Email <SortIcon field="email" /></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Skills
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort('submitted')}
                >
                  <span className="inline-flex items-center">Submitted <SortIcon field="submitted" /></span>
                </th>
                <th
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900"
                  onClick={() => handleSort('status')}
                >
                  <span className="inline-flex items-center">Status <SortIcon field="status" /></span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-600">
                    No applications found
                  </td>
                </tr>
              ) : (
                sortedApplications.map((application) => {
                  const createdAt = toDate(application.createdAt)
                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-700',
                    approved: 'bg-green-100 text-green-700',
                    rejected: 'bg-red-100 text-red-700',
                    withdrawn: 'bg-slate-100 text-slate-700',
                  }

                  return (
                    <tr key={application.id} className={`hover:bg-slate-50 ${application.emailedAt ? 'bg-blue-50/50 border-l-2 border-l-blue-400' : ''} ${selectedIds.has(application.id) ? 'bg-blue-50' : ''}`}>
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(application.id)}
                          onChange={() => toggleSelect(application.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {application.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a
                          href={`mailto:${application.email}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {application.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          {application.skills.slice(0, 2).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                          {application.skills.length > 2 && (
                            <span className="text-xs text-slate-500">
                              +{application.skills.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                              statusColors[application.status]
                            }`}
                          >
                            {application.status}
                          </span>
                          {application.emailedAt && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600" title={`Emailed ${formatDate(toDate(application.emailedAt))}`}>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Responded
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(application)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => openEmailModal(application)}
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            title={`Email ${application.name}`}
                          >
                            <svg className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Email Compose Slide-over */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => !bulkEmailSending && closeBulkEmailModal()}
          />
          {/* Panel */}
          <div className="relative w-full max-w-[50%] animate-slide-in-right flex flex-col border-l border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bulk Email</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sending to {selectedApps.length} volunteer{selectedApps.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => !bulkEmailSending && closeBulkEmailModal()}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                disabled={bulkEmailSending}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Recipients preview */}
              <div className="mb-5 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Recipients ({selectedApps.length})</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedApps.map((app) => (
                    <span key={app.id} className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                      {app.name || app.email}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personalisation hint */}
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                <strong>Tip:</strong> Use <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">[Name]</code> in subject or message to personalise each email with the volunteer&apos;s name.
              </div>

              {/* Progress bar */}
              {(bulkEmailSending || bulkEmailDone) && (
                <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-slate-900">
                      {bulkEmailSending ? 'Sending...' : 'Complete'}
                    </span>
                    <span className="text-slate-500">
                      {bulkEmailProgress.sent + bulkEmailProgress.failed} / {bulkEmailProgress.total}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${bulkEmailProgress.total > 0 ? ((bulkEmailProgress.sent + bulkEmailProgress.failed) / bulkEmailProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="text-green-600 font-medium">✓ {bulkEmailProgress.sent} sent</span>
                    {bulkEmailProgress.failed > 0 && (
                      <span className="text-red-600 font-medium">✕ {bulkEmailProgress.failed} failed</span>
                    )}
                  </div>
                  {bulkEmailDone && (
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      {bulkEmailProgress.sent > 0 ? `Successfully sent ${bulkEmailProgress.sent} email${bulkEmailProgress.sent !== 1 ? 's' : ''}!` : 'No emails were sent.'}
                    </p>
                  )}
                </div>
              )}

              {!bulkEmailDone && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-900">Subject</label>
                    <input
                      type="text"
                      value={bulkEmailSubject}
                      onChange={(e) => setBulkEmailSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Email subject..."
                      disabled={bulkEmailSending}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="mb-1 block text-sm font-semibold text-slate-900">Message</label>
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto'
                          el.style.height = el.scrollHeight + 'px'
                        }
                      }}
                      value={bulkEmailBody}
                      onChange={(e) => {
                        setBulkEmailBody(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      className="w-full min-h-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none overflow-hidden"
                      placeholder="Write your message..."
                      disabled={bulkEmailSending}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
              {!bulkEmailDone ? (
                <>
                  <button
                    onClick={handleBulkSendEmail}
                    disabled={bulkEmailSending || !bulkEmailSubject.trim() || !bulkEmailBody.trim()}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkEmailSending
                      ? `Sending ${bulkEmailProgress.sent + bulkEmailProgress.failed}/${bulkEmailProgress.total}...`
                      : `Send to ${selectedApps.length} Volunteer${selectedApps.length !== 1 ? 's' : ''}`}
                  </button>
                  <button
                    onClick={closeBulkEmailModal}
                    disabled={bulkEmailSending}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={closeBulkEmailModal}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Slide-over */}
      {showEmailModal && emailTarget && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => closeEmailModal()}
          />
          {/* Panel */}
          <div className="relative w-full max-w-[50%] animate-slide-in-right flex flex-col border-l border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Email Volunteer</h2>
              <button
                onClick={() => closeEmailModal()}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">To:</p>
                <p className="font-medium text-slate-900">{emailTarget.name} &lt;{emailTarget.email}&gt;</p>
              </div>

              {emailSuccess && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {emailSuccess}
                </div>
              )}
              {emailError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {emailError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-900">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Email subject..."
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="mb-1 block text-sm font-semibold text-slate-900">Message</label>
                  <textarea
                    rows={14}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Write your message..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSending ? 'Sending...' : 'Send Email'}
              </button>
              <button
                onClick={() => closeEmailModal()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Review Application</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedApplication(null)
                  setReviewNotes('')
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Application Details */}
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-semibold text-slate-900">Personal Information</h3>
                  <div className="mt-1 space-y-1 text-slate-600">
                    <p><span className="font-medium">Name:</span> {selectedApplication.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedApplication.email}</p>
                    {selectedApplication.phone && (
                      <p><span className="font-medium">Phone:</span> {selectedApplication.phone}</p>
                    )}
                    {selectedApplication.address && (
                      <p>
                        <span className="font-medium">Address:</span> {selectedApplication.address}
                        {selectedApplication.city && `, ${selectedApplication.city}`}
                        {selectedApplication.state && `, ${selectedApplication.state}`}
                        {selectedApplication.zipCode && ` ${selectedApplication.zipCode}`}
                      </p>
                    )}
                    {selectedApplication.dateOfBirth && (
                      <p><span className="font-medium">Date of Birth:</span> {selectedApplication.dateOfBirth}</p>
                    )}
                    {selectedApplication.gender && (
                      <p><span className="font-medium">Gender:</span> {selectedApplication.gender}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Availability</h3>
                  <p className="mt-1 text-slate-600">{selectedApplication.availability}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Skills</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedApplication.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Experience</h3>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">{selectedApplication.experience}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Motivation</h3>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">{selectedApplication.motivation}</p>
                </div>

                {selectedApplication.references && (
                  <div>
                    <h3 className="font-semibold text-slate-900">References</h3>
                    <p className="mt-1 whitespace-pre-wrap text-slate-600">{selectedApplication.references}</p>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="border-t border-slate-200 pt-4">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Status
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as VolunteerApplicationStatus)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Add any notes or comments about this application..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateStatus}
                      disabled={processing}
                      className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Updating...' : 'Update Status'}
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false)
                        setSelectedApplication(null)
                        setReviewNotes('')
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

