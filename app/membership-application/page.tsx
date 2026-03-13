'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getMembershipApplicationByUser } from '@/lib/firebase/firestore'
import MembershipApplicationForm from '@/app/components/MembershipApplicationForm'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

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
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Join DCP</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Membership Application</h1>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="text-slate-600">Checking application status...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Join DCP</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Membership Application</h1>
            <p className="text-sm text-slate-300 sm:text-base">&ldquo;Defending the Constitution is Defending Our Future&rdquo;</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Info Banner */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-amber-900">Defend the Constitution Platform (DCP)</h3>
                <p className="mt-1 text-sm text-amber-700">
                  The DCP is a non-partisan, non-electoral platform dedicated to the defence, protection, and full implementation 
                  of the 2013 Constitution of Zimbabwe. Membership is open to individuals and organisations who share this commitment.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <MembershipApplicationForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function MembershipApplicationPage() {
  return (
    <ProtectedRoute>
      <MembershipApplicationContent />
    </ProtectedRoute>
  )
}
