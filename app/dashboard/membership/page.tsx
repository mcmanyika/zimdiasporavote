'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import DashboardNav from '@/app/components/DashboardNav'
import MembershipCheckout from '@/app/components/MembershipCheckout'
import MembershipCard from '@/app/components/MembershipCard'
import Link from 'next/link'

export default function MembershipPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  // Refresh membership card when page becomes visible (e.g., after returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((prev) => prev + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh on mount in case user navigated here after payment
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1)
    }, 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(timer)
    }
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Membership</h1>
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>

        <DashboardNav />

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-8" key={refreshKey}>
            <MembershipCard />
          </div>

          {/* Diaspora Vote membership application */}
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Diaspora Vote membership application</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Apply to become an official member of Diaspora Vote
                </p>
              </div>
              <Link
                href="/membership-application"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Apply Now →
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Make Membership Payment</h2>
              <p className="mt-1 text-slate-600">
                Support our mission and unlock exclusive benefits
              </p>
            </div>
            <MembershipCheckout />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

