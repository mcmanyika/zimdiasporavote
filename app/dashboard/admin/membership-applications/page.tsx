'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/DashboardNav'
import Link from 'next/link'
import { getMembershipApplications, updateMembershipApplication, deleteMembershipApplication, markMembershipApplicationEmailed, markMembershipApplicationsEmailedBatch, saveEmailDraft, getEmailDraft, deleteEmailDraft, createCashMembership } from '@/lib/firebase/firestore'
import type { MembershipApplication, MembershipApplicationStatus, PaymentMethod } from '@/types'

const statusColors: Record<MembershipApplicationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-slate-100 text-slate-600',
}

const participationLabels: Record<string, string> = {
  civic_education: 'Civic education',
  legal_constitutional: 'Legal & constitutional advocacy',
  parliamentary: 'Parliamentary engagement',
  community_mobilisation: 'Community mobilisation',
  research_policy: 'Research & policy',
  communications_media: 'Communications & media',
  other: 'Other',
}

const orgTypeLabels: Record<string, string> = {
  civic: 'Civic organisation',
  labour: 'Labour / Trade Union',
  faith: 'Faith-based institution',
  student_youth: 'Student / Youth organisation',
  professional: 'Professional association',
  community_residents: 'Community / Residents\' association',
  liberation_veterans: 'Liberation War Veterans\' Association',
  other: 'Other',
}

// Membership pricing tiers for cash payment recording
const CASH_PAYMENT_PLANS = [
  { id: 'general', label: 'General Citizens', amount: 5, period: 'yearly' as const },
  { id: 'students', label: 'Students / Youth', amount: 2, period: 'yearly' as const },
  { id: 'students_vets', label: 'Students / War Vets / Unemployed', amount: 3, period: 'yearly' as const },
  { id: 'diaspora_monthly', label: 'Diaspora Citizens – Monthly', amount: 5, period: 'monthly' as const },
  { id: 'diaspora_yearly', label: 'Diaspora Citizens – Yearly', amount: 60, period: 'yearly' as const },
  { id: 'workers', label: 'Workers / Informal Traders', amount: 3, period: 'yearly' as const },
  { id: 'liberation', label: 'Liberation War Veterans', amount: 0, period: 'yearly' as const },
  { id: 'unwaged', label: 'Unwaged / Vulnerable Persons', amount: 0, period: 'yearly' as const },
  { id: 'micro', label: 'Monthly Micro-Subscription', amount: 1, period: 'monthly' as const },
  { id: 'cbo', label: 'Small Community-Based Organisations', amount: 25, period: 'yearly' as const },
  { id: 'trade_union', label: 'Local Trade Unions / Faith-Based Bodies', amount: 50, period: 'yearly' as const },
  { id: 'national_civic', label: 'National Civic Organisations & Political Parties', amount: 300, period: 'yearly' as const },
  { id: 'professional', label: 'Professional Associations', amount: 250, period: 'yearly' as const },
]

export default function AdminMembershipApplicationsPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<MembershipApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MembershipApplicationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Section E fields
  const [membershipNumber, setMembershipNumber] = useState('')
  const [provinceAllocated, setProvinceAllocated] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  // Cash payment modal state
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashTarget, setCashTarget] = useState<MembershipApplication | null>(null)
  const [cashPlanId, setCashPlanId] = useState('general')
  const [cashAmount, setCashAmount] = useState(5)
  const [cashMethod, setCashMethod] = useState<PaymentMethod>('cash')
  const [cashNotes, setCashNotes] = useState('')
  const [cashSaving, setCashSaving] = useState(false)
  const [cashSuccess, setCashSuccess] = useState('')
  const [cashError, setCashError] = useState('')

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTarget, setEmailTarget] = useState<MembershipApplication | null>(null)
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

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const apps = await getMembershipApplications()
      setApplications(apps)
    } catch (error) {
      console.error('Error loading membership applications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cash payment handlers
  const openCashModal = (app: MembershipApplication) => {
    setCashTarget(app)
    setCashPlanId('general')
    setCashAmount(5)
    setCashMethod('cash')
    setCashNotes('')
    setCashSuccess('')
    setCashError('')
    setShowCashModal(true)
  }

  const handleCashPlanChange = (planId: string) => {
    setCashPlanId(planId)
    const plan = CASH_PAYMENT_PLANS.find((p) => p.id === planId)
    if (plan) setCashAmount(plan.amount)
  }

  const handleRecordCashPayment = async () => {
    if (!cashTarget || !userProfile) return
    const plan = CASH_PAYMENT_PLANS.find((p) => p.id === cashPlanId)
    if (!plan) return

    setCashSaving(true)
    setCashError('')
    setCashSuccess('')

    try {
      await createCashMembership({
        userId: cashTarget.userId || '',
        tier: cashPlanId,
        amount: cashAmount,
        billingPeriod: plan.period,
        paymentMethod: cashMethod,
        planLabel: plan.label,
        recordedBy: userProfile.uid || userProfile.email || 'admin',
        notes: cashNotes.trim() || '',
      })

      // Ensure application is approved and has a membership number after manual payment.
      const updateData: Partial<MembershipApplication> = {}
      if (cashTarget.status === 'pending') {
        updateData.status = 'approved' as MembershipApplicationStatus
        updateData.approvedBy = userProfile.name || 'Admin'
        updateData.dateReceived = new Date().toISOString().split('T')[0]
      }
      if (!cashTarget.membershipNumber) {
        updateData.membershipNumber = generateMembershipNumber(cashTarget)
      }
      if (Object.keys(updateData).length > 0) {
        await updateMembershipApplication(cashTarget.id, updateData)
      }

      const nextDue = new Date()
      if (plan.period === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1)
      } else {
        nextDue.setFullYear(nextDue.getFullYear() + 1)
      }

      setCashSuccess(`Payment recorded! Next due: ${nextDue.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`)
      await loadApplications()
    } catch (err: any) {
      console.error('Error recording cash payment:', err)
      setCashError(err.message || 'Failed to record payment')
    } finally {
      setCashSaving(false)
    }
  }

  const handleStatusUpdate = async (appId: string, status: MembershipApplicationStatus) => {
    setActionLoading(true)
    try {
      const updateData: any = {
        status,
        approvedBy: userProfile?.name || 'Admin',
        dateReceived: new Date().toISOString().split('T')[0],
      }
      if (membershipNumber.trim()) updateData.membershipNumber = membershipNumber.trim()
      if (provinceAllocated.trim()) updateData.provinceAllocated = provinceAllocated.trim()
      if (reviewNotes.trim()) updateData.reviewNotes = reviewNotes.trim()

      await updateMembershipApplication(appId, updateData)
      await loadApplications()
      setSelectedApp(null)
      setMembershipNumber('')
      setProvinceAllocated('')
      setReviewNotes('')
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    try {
      await deleteMembershipApplication(appId)
      await loadApplications()
      if (selectedApp?.id === appId) setSelectedApp(null)
    } catch (error) {
      console.error('Error deleting application:', error)
      alert('Failed to delete application')
    }
  }

  const generateMembershipNumber = (app: MembershipApplication): string => {
    // If already has a membership number, keep it
    if (app.membershipNumber) return app.membershipNumber

    const year = new Date().getFullYear()
    // Count all applications that already have a membership number
    const existingNumbers = applications
      .filter(a => a.membershipNumber)
      .map(a => {
        const match = a.membershipNumber!.match(/DCP-\d{4}-(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
    return `DCP-${year}-${String(nextNumber).padStart(3, '0')}`
  }

  const openDetail = (app: MembershipApplication) => {
    setSelectedApp(app)
    setMembershipNumber(generateMembershipNumber(app))
    setProvinceAllocated(app.provinceAllocated || '')
    setReviewNotes(app.reviewNotes || '')
  }

  const openEmailModal = async (app: MembershipApplication) => {
    setEmailTarget(app)
    setEmailSuccess('')
    setEmailError('')
    setShowEmailModal(true)

    // Try to load existing draft
    try {
      const draft = await getEmailDraft('membership', app.id)
      if (draft) {
        setEmailSubject(draft.subject)
        setEmailBody(draft.body)
        return
      }
    } catch (e) { /* ignore */ }

    // No draft — use default template
    const applicantName = app.type === 'individual' ? app.fullName : app.organisationName
    setEmailSubject(`Your DCP Membership Application – Next Step`)
    setEmailBody(
      `Thank you for submitting your membership application to the Defend the Constitution Platform (DCP). We sincerely appreciate your commitment to defending Zimbabwe's Constitution and strengthening citizen participation.\n\nWe are pleased to inform you that your application has been received. The next step to activate your membership is the membership contribution, which can be made as either:\n\n$5 per month, or\n\n$60 per year\n\nThis contribution supports our civic education, mobilisation, petition outreach, and constitutional defence work across Zimbabwe.\n\nOnce your payment is received, your membership will be formally activated, and you will begin receiving updates, invitations, and opportunities to actively participate in DCP initiatives.\n\nYou can complete your membership payment by visiting:\nwww.dcpzim.com\n\nThank you for standing with us in defence of the Constitution and the future of Zimbabwe. For inquiries please do not hesitate to contact us.`
    )
  }

  const closeEmailModal = async () => {
    // Save draft if there's content
    if (emailTarget && (emailSubject.trim() || emailBody.trim())) {
      const name = emailTarget.type === 'individual' ? emailTarget.fullName : emailTarget.organisationName
      const email = emailTarget.emailAddress || emailTarget.representativeEmail
      try {
        await saveEmailDraft({
          context: 'membership',
          targetId: emailTarget.id,
          recipientEmail: email || '',
          recipientName: name || 'Applicant',
          subject: emailSubject,
          body: emailBody,
          createdBy: userProfile?.uid || '',
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
    const name = emailTarget.type === 'individual' ? emailTarget.fullName : emailTarget.organisationName
    const email = emailTarget.emailAddress || emailTarget.representativeEmail
    if (!email) {
      setEmailError('No email address found for this applicant.')
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
          email,
          name: name || 'Applicant',
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
        await markMembershipApplicationEmailed(emailTarget.id)
        await deleteEmailDraft('membership', emailTarget.id)
        await loadApplications()
      } catch (e) { /* non-critical */ }
      setEmailSuccess(`Email sent to ${email}`)
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

  const filtered = applications.filter((app) => {
    if (filter !== 'all' && app.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      const name = (app.type === 'individual' ? app.fullName : app.organisationName) || ''
      const email = app.emailAddress || app.representativeEmail || ''
      if (!name.toLowerCase().includes(s) && !email.toLowerCase().includes(s) && !app.id.toLowerCase().includes(s)) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedApps = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const allPageSelected = paginatedApps.length > 0 && paginatedApps.every((a) => selectedIds.has(a.id))
  const somePageSelected = paginatedApps.some((a) => selectedIds.has(a.id))

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedApps.map((a) => a.id)))
    }
  }

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((a) => a.id)))
  }

  const selectedApps = applications.filter((a) => selectedIds.has(a.id))

  const getDefaultBulkTemplate = () => ({
    subject: 'Your DCP Membership Application – Next Step',
    body: `Thank you for submitting your membership application to the Defend the Constitution Platform (DCP). We sincerely appreciate your commitment to defending Zimbabwe's Constitution and strengthening citizen participation.\n\nWe are pleased to inform you that your application has been received. The next step to activate your membership is the membership contribution, which can be made as either:\n\n$5 per month, or\n\n$60 per year\n\nThis contribution supports our civic education, mobilisation, petition outreach, and constitutional defence work across Zimbabwe.\n\nOnce your payment is received, your membership will be formally activated, and you will begin receiving updates, invitations, and opportunities to actively participate in DCP initiatives.\n\nYou can complete your membership payment by visiting:\nwww.dcpzim.com\n\nThank you for standing with us in defence of the Constitution and the future of Zimbabwe. For inquiries please do not hesitate to contact us.`,
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
      const name = app.type === 'individual' ? app.fullName : app.organisationName
      const email = app.emailAddress || app.representativeEmail
      if (!email) {
        failed++
        setBulkEmailProgress({ sent, failed, total })
        continue
      }

      // Personalise: replace [Name] with actual name
      const personalBody = bulkEmailBody.replace(/\[Name\]/gi, name || 'Applicant')
      const personalSubject = bulkEmailSubject.replace(/\[Name\]/gi, name || 'Applicant')

      try {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: name || 'Applicant',
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

    // Mark all successful ones as emailed in a batch
    if (successIds.length > 0) {
      try {
        await markMembershipApplicationsEmailedBatch(successIds)
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

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, search])

  // Clear selection when filter/search changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, search])

  const formatDate = (date: any): string => {
    if (!date) return '—'
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  // Auth guard
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userProfile, router])

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Membership Applications</h1>
                <p className="mt-1 text-sm text-slate-500">Review and manage DCP membership applications</p>
              </div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>

        <DashboardNav />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total', count: counts.all, color: 'bg-slate-900' },
              { label: 'Pending', count: counts.pending, color: 'bg-amber-500' },
              { label: 'Approved', count: counts.approved, color: 'bg-green-600' },
              { label: 'Rejected', count: counts.rejected, color: 'bg-red-500' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${stat.color}`} />
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.count}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'approved', 'rejected', 'withdrawn'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:w-64"
            />
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-900">
                  {selectedIds.size} applicant{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                {selectedIds.size < filtered.length && (
                  <button
                    onClick={selectAllFiltered}
                    className="text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                  >
                    Select all {filtered.length} filtered
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

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Province</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApps.map((app) => {
                    const name = app.type === 'individual' ? app.fullName : app.organisationName
                    const email = app.emailAddress || app.representativeEmail
                    const province = app.type === 'individual' ? app.province : app.provincesOfOperation
                    const phone = app.type === 'individual' ? app.mobileNumber : app.representativeMobile
                    return (
                      <tr key={app.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${app.emailedAt ? 'bg-blue-50/50 border-l-2 border-l-blue-400' : ''} ${selectedIds.has(app.id) ? 'bg-blue-50' : ''}`} onClick={() => openDetail(app)}>
                        <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{name || '—'}</p>
                          <a
                            href={`mailto:${email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {email || '—'}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize">
                            {app.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{province || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {phone ? (
                            <a
                              href={`tel:${phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:underline"
                            >
                              {phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[app.status]}`}>
                            {app.status}
                          </span>
                            {app.emailedAt && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600" title={`Emailed ${formatDate(app.emailedAt)}`}>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Responded
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(app.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEmailModal(app) }}
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            title={`Email ${name || 'applicant'}`}
                          >
                            <svg className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                              currentPage === page
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      }
                      if (
                        (page === currentPage - 3 && currentPage > 4) ||
                        (page === currentPage + 3 && currentPage < totalPages - 3)
                      ) {
                        return <span key={page} className="px-2 text-xs text-slate-400">…</span>
                      }
                      return null
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-slate-900 px-6 py-4 rounded-t-xl">
                <div>
                  <h2 className="text-lg font-bold text-white">Application Details</h2>
                  <p className="text-xs text-slate-300">ID: {selectedApp.id}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Type & Status */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 capitalize">
                    {selectedApp.type} Membership
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColors[selectedApp.status]}`}>
                    {selectedApp.status}
                  </span>
                </div>

                {/* Details */}
                {selectedApp.type === 'individual' ? (
                  <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Individual Details</h4>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div><span className="text-slate-500">Full Name:</span> <span className="font-medium">{selectedApp.fullName}</span></div>
                      {selectedApp.nationalIdPassport && <div><span className="text-slate-500">ID/Passport:</span> <span className="font-medium">{selectedApp.nationalIdPassport}</span></div>}
                      {selectedApp.gender && <div><span className="text-slate-500">Gender:</span> <span className="font-medium">{selectedApp.gender}</span></div>}
                      {selectedApp.dateOfBirth && <div><span className="text-slate-500">Date of Birth:</span> <span className="font-medium">{selectedApp.dateOfBirth}</span></div>}
                      {selectedApp.province && <div><span className="text-slate-500">Province:</span> <span className="font-medium">{selectedApp.province}</span></div>}
                      {selectedApp.district && <div><span className="text-slate-500">District/Ward:</span> <span className="font-medium">{selectedApp.district}</span></div>}
                      {selectedApp.occupation && <div><span className="text-slate-500">Occupation:</span> <span className="font-medium">{selectedApp.occupation}</span></div>}
                      <div><span className="text-slate-500">Mobile:</span> <span className="font-medium">{selectedApp.mobileNumber}</span></div>
                      <div><span className="text-slate-500">Email:</span> <span className="font-medium">{selectedApp.emailAddress}</span></div>
                    </div>
                    {selectedApp.participationAreas && selectedApp.participationAreas.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Participation Areas: </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedApp.participationAreas.map((a) => (
                            <span key={a} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {participationLabels[a] || a}
                            </span>
                          ))}
                        </div>
                        {selectedApp.participationOther && (
                          <p className="mt-1 text-xs text-slate-600">Other: {selectedApp.participationOther}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Organisation Details</h4>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div className="sm:col-span-2"><span className="text-slate-500">Organisation:</span> <span className="font-medium">{selectedApp.organisationName}</span></div>
                      <div><span className="text-slate-500">Type:</span> <span className="font-medium">{orgTypeLabels[selectedApp.organisationType || ''] || selectedApp.organisationType}</span></div>
                      {selectedApp.organisationTypeOther && <div><span className="text-slate-500">Type (Other):</span> <span className="font-medium">{selectedApp.organisationTypeOther}</span></div>}
                      {selectedApp.registrationStatus && <div><span className="text-slate-500">Registration:</span> <span className="font-medium">{selectedApp.registrationStatus}</span></div>}
                      {selectedApp.physicalAddress && <div className="sm:col-span-2"><span className="text-slate-500">Address:</span> <span className="font-medium">{selectedApp.physicalAddress}</span></div>}
                      {selectedApp.provincesOfOperation && <div><span className="text-slate-500">Provinces:</span> <span className="font-medium">{selectedApp.provincesOfOperation}</span></div>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <h5 className="text-xs font-semibold text-slate-500 mb-2">Designated Representative</h5>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedApp.representativeName}</span></div>
                        {selectedApp.representativePosition && <div><span className="text-slate-500">Position:</span> <span className="font-medium">{selectedApp.representativePosition}</span></div>}
                        <div><span className="text-slate-500">Mobile:</span> <span className="font-medium">{selectedApp.representativeMobile}</span></div>
                        <div><span className="text-slate-500">Email:</span> <span className="font-medium">{selectedApp.representativeEmail}</span></div>
                      </div>
                      {selectedApp.alternateRepresentative && (
                        <p className="mt-2 text-sm"><span className="text-slate-500">Alternate:</span> <span className="font-medium">{selectedApp.alternateRepresentative}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Declaration */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Declaration</h4>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedApp.declarationAccepted ? (
                      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                    <span className="font-medium">{selectedApp.declarationAccepted ? 'Accepted' : 'Not accepted'}</span>
                  </div>
                  {selectedApp.signatureName && (
                    <p className="mt-1 text-sm text-slate-600">
                      Signed by: <span className="italic font-medium">{selectedApp.signatureName}</span>
                      {selectedApp.signatureDate && ` on ${selectedApp.signatureDate}`}
                    </p>
                  )}
                </div>

                {/* Section E: Official Use */}
                <div className="rounded-lg border-2 border-dashed border-slate-300 p-4">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Section E: For Official Use Only</h4>
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Membership Number</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={membershipNumber}
                            onChange={(e) => setMembershipNumber(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            readOnly
                          />
                          <button
                            type="button"
                            onClick={() => setMembershipNumber(generateMembershipNumber({ ...selectedApp!, membershipNumber: undefined } as MembershipApplication))}
                            className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            title="Regenerate membership number"
                          >
                            ↻
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">Auto-generated. Click ↻ to regenerate.</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Province / Desk Allocated</label>
                        <input
                          type="text"
                          value={provinceAllocated}
                          onChange={(e) => setProvinceAllocated(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Review Notes</label>
                      <textarea
                        rows={2}
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="Add notes about this application..."
                      />
                    </div>
                    {selectedApp.approvedBy && (
                      <p className="text-xs text-slate-500">
                        Processed by: {selectedApp.approvedBy} {selectedApp.dateReceived && `on ${selectedApp.dateReceived}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Change Status */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Change Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'approved', 'rejected', 'withdrawn'] as MembershipApplicationStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusUpdate(selectedApp.id, s)}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedApp.status === s
                            ? s === 'approved' ? 'bg-green-600 text-white ring-2 ring-green-300'
                            : s === 'rejected' ? 'bg-red-600 text-white ring-2 ring-red-300'
                            : s === 'pending' ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                            : 'bg-slate-600 text-white ring-2 ring-slate-300'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {actionLoading ? '...' : s}
                      </button>
                    ))}
                  </div>
                  {selectedApp.status !== 'pending' && (
                    <p className="mt-2 text-[10px] text-slate-400">
                      Current status: <span className="font-semibold capitalize">{selectedApp.status}</span>. Click a button above to change.
                    </p>
                  )}
                </div>

                {/* Record Payment */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-700">Record Payment</label>
                  <p className="mb-3 text-xs text-emerald-600">For cash, bank transfer, or mobile money payments made outside Stripe.</p>
                  <button
                    onClick={() => openCashModal(selectedApp)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Record Manual Payment
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedApp.id, selectedApp.status)}
                    disabled={actionLoading}
                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Payment Modal */}
        {showCashModal && cashTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !cashSaving && setShowCashModal(false)} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900">Record Manual Payment</h3>
              <p className="mt-1 text-sm text-slate-500">
                For <span className="font-semibold text-slate-700">{cashTarget.fullName || cashTarget.organisationName || 'Applicant'}</span>
              </p>

              {cashSuccess && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-sm font-semibold text-emerald-700">{cashSuccess}</p>
      </div>
              )}
              {cashError && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-semibold text-red-700">{cashError}</p>
                </div>
              )}

              {!cashSuccess && (
                <div className="mt-5 space-y-4">
                  {/* Payment Method */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'cash' as PaymentMethod, label: 'Cash' },
                        { value: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer' },
                        { value: 'mobile_money' as PaymentMethod, label: 'Mobile Money' },
                      ]).map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setCashMethod(m.value)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            cashMethod === m.value
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Membership Plan</label>
                    <select
                      value={cashPlanId}
                      onChange={(e) => handleCashPlanChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <optgroup label="Individual (Annual)">
                        {CASH_PAYMENT_PLANS.filter((p) => ['general', 'students', 'students_vets', 'diaspora_monthly', 'diaspora_yearly', 'workers', 'liberation', 'unwaged'].includes(p.id)).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label} — ${p.amount}/{p.period === 'monthly' ? 'mo' : 'yr'}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Monthly Micro-Subscription">
                        {CASH_PAYMENT_PLANS.filter((p) => p.id === 'micro').map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label} — ${p.amount}/mo
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Institutional (Annual)">
                        {CASH_PAYMENT_PLANS.filter((p) => ['cbo', 'trade_union', 'national_civic', 'professional'].includes(p.id)).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label} — ${p.amount}/yr
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Amount (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Pre-filled from plan. Adjust for voluntary / partial amounts.
                    </p>
                  </div>

                  {/* Next Due Date Preview */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Next due date:</span>{' '}
                      {(() => {
                        const plan = CASH_PAYMENT_PLANS.find((p) => p.id === cashPlanId)
                        const next = new Date()
                        if (plan?.period === 'monthly') next.setMonth(next.getMonth() + 1)
                        else next.setFullYear(next.getFullYear() + 1)
                        return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      })()}
                    </p>
                    <p className="mt-0.5 text-[10px] text-blue-500">
                      Auto-calculated: +1 {CASH_PAYMENT_PLANS.find((p) => p.id === cashPlanId)?.period === 'monthly' ? 'month' : 'year'} from today
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={cashNotes}
                      onChange={(e) => setCashNotes(e.target.value)}
                      placeholder="e.g. Cash received at Harare office, receipt #123"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleRecordCashPayment}
                      disabled={cashSaving || cashAmount <= 0}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cashSaving ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Recording…
                        </>
                      ) : (
                        'Confirm Payment'
                      )}
                    </button>
                    <button
                      onClick={() => setShowCashModal(false)}
                      disabled={cashSaving}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {cashSuccess && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowCashModal(false)}
                    className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
                    Sending to {selectedApps.length} applicant{selectedApps.length !== 1 ? 's' : ''}
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
                    {selectedApps.map((app) => {
                      const name = app.type === 'individual' ? app.fullName : app.organisationName
                      const email = app.emailAddress || app.representativeEmail
                      return (
                        <span key={app.id} className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                          {name || email || 'Unknown'}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Personalisation hint */}
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                  <strong>Tip:</strong> Use <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">[Name]</code> in subject or message to personalise each email with the applicant&apos;s name.
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
                        : `Send to ${selectedApps.length} Applicant${selectedApps.length !== 1 ? 's' : ''}`}
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
                <h2 className="text-lg font-bold text-slate-900">Email Applicant</h2>
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
                  <p className="font-medium text-slate-900">
                    {emailTarget.type === 'individual' ? emailTarget.fullName : emailTarget.organisationName} &lt;{emailTarget.emailAddress || emailTarget.representativeEmail}&gt;
                  </p>
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
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto'
                          el.style.height = el.scrollHeight + 'px'
                        }
                      }}
                      value={emailBody}
                      onChange={(e) => {
                        setEmailBody(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      className="w-full min-h-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none overflow-hidden"
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
      </div>
  )
}
