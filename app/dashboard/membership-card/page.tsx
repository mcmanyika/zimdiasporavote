'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getMembershipByUser, getMembershipApplicationByUser } from '@/lib/firebase/firestore'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import DashboardNav from '@/app/components/DashboardNav'
import MembershipIDCard from '@/app/components/MembershipIDCard'
import Link from 'next/link'
import type { Membership, MembershipApplication } from '@/types'

function toDate(date: Date | any): Date | null {
  if (!date) return null
  if (date instanceof Date) return date
  if (date && typeof date === 'object' && 'toDate' in date) {
    return (date as any).toDate()
  }
  return new Date(date as string | number)
}

function MembershipCardContent() {
  const { user, userProfile } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [application, setApplication] = useState<MembershipApplication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const [membershipData, appData] = await Promise.all([
          getMembershipByUser(user.uid),
          getMembershipApplicationByUser(user.uid),
        ])
        setMembership(membershipData)
        setApplication(appData)
      } catch (err) {
        console.error('Error fetching membership data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Determine if user is a paid-up member
  const isPaidMember = membership?.status === 'succeeded'
  const isApproved = application?.status === 'approved'
  const hasMembershipNumber = !!application?.membershipNumber

  // Build card data
  const memberName = application?.type === 'individual'
    ? application?.fullName || userProfile?.name || user?.displayName || 'Member'
    : application?.organisationName || userProfile?.name || user?.displayName || 'Member'

  const membershipNumber = application?.membershipNumber || '—'
  const province = application?.type === 'individual'
    ? application?.provinceAllocated || application?.province
    : application?.provinceAllocated || application?.provincesOfOperation

  const membershipCreatedAt = toDate(membership?.createdAt)
  const dateJoined = membershipCreatedAt
    ? membershipCreatedAt.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  // Expiry is 1 year from membership payment
  const expiryDate = membershipCreatedAt
    ? new Date(membershipCreatedAt.getFullYear() + 1, membershipCreatedAt.getMonth(), membershipCreatedAt.getDate())
        .toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  const canViewCard = isPaidMember && isApproved && hasMembershipNumber

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
          <p className="text-sm text-slate-500">Loading membership details...</p>
        </div>
      </div>
    )
  }

  if (!canViewCard) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">🪪</div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Membership Card Not Available</h2>

          {!isPaidMember && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-4">
                You need an active membership payment to view your membership card.
              </p>
              <Link
                href="/dashboard/membership"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Make Membership Payment →
              </Link>
            </div>
          )}

          {isPaidMember && !isApproved && (
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-4">
                Your membership application is still being reviewed. Your card will be available once approved.
              </p>
              {!application && (
                <Link
                  href="/membership-application"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Apply for Membership →
                </Link>
              )}
              {application && (
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Application {application.status}
                </div>
              )}
            </div>
          )}

          {isPaidMember && isApproved && !hasMembershipNumber && (
            <p className="text-sm text-slate-600">
              Your application has been approved but a membership number hasn&apos;t been assigned yet. Please check back soon.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">Your Membership Card</h2>
        <p className="text-sm text-slate-500">View and print your official DV membership card</p>
      </div>

      <MembershipIDCard
        memberName={memberName}
        membershipNumber={membershipNumber}
        province={province}
        dateJoined={dateJoined}
        expiryDate={expiryDate}
        photoURL={userProfile?.photoURL || user?.photoURL || undefined}
        memberEmail={user?.email || undefined}
      />
    </div>
  )
}

export default function MembershipCardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Membership Card</h1>
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

        <MembershipCardContent />
      </div>
    </ProtectedRoute>
  )
}
