'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getMembershipApplicationByUser } from '@/lib/firebase/firestore'
import MembershipApplicationForm from '@/app/components/MembershipApplicationForm'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import PartyLinkedDashboardShell from '@/app/components/PartyLinkedDashboardShell'

function MembershipApplicationContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkExistingApplication() {
      if (!user) return
      try {
        const existing = await getMembershipApplicationByUser(user.uid)
        if (existing) {
          router.replace('/dashboard')
          return
        }
      } catch (err) {
        console.error('Error checking existing application:', err)
      }
      setChecking(false)
    }
    checkExistingApplication()
  }, [user, router])

  if (checking) {
    return (
      <PartyLinkedDashboardShell
        title="Join the Movement"
        breadcrumbLabel="Membership"
        headerDescription="Membership application — Defend the Constitution Platform (DCP)."
        maxWidthClass="max-w-3xl"
      >
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="text-slate-600">Checking application status...</p>
          </div>
        </div>
      </PartyLinkedDashboardShell>
    )
  }

  return (
    <PartyLinkedDashboardShell
      title="Join the Movement"
      breadcrumbLabel="Membership"
      headerDescription="“Defending the Constitution is Defending Our Future” — non-partisan membership in the DCP."
      maxWidthClass="max-w-3xl"
    >
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Defend the Constitution Platform (DCP)</h3>
            <p className="mt-1 text-sm text-amber-700">
              The DCP is a non-partisan, non-electoral platform dedicated to the defence, protection, and full implementation
              of the 2013 Constitution of Zimbabwe. Membership is open to individuals and organisations who share this
              commitment.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <MembershipApplicationForm />
      </section>
    </PartyLinkedDashboardShell>
  )
}

export default function MembershipApplicationPage() {
  return (
    <ProtectedRoute>
      <MembershipApplicationContent />
    </ProtectedRoute>
  )
}
