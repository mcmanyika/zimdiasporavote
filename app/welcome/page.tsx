'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import DonationModal from '@/app/components/DonationModal'

function WelcomeContent() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next')
  const [donationModalOpen, setDonationModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Auto-show donation modal on first visit
  useEffect(() => {
    if (!loading && user) {
      const hasSeenDonateModal = sessionStorage.getItem('welcome_donate_shown')
      if (!hasSeenDonateModal) {
        const timer = setTimeout(() => {
          setDonationModalOpen(true)
          sessionStorage.setItem('welcome_donate_shown', '1')
        }, 1500) // slight delay so user reads the welcome message first
        return () => clearTimeout(timer)
      }
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const displayName = userProfile?.name || user?.displayName || 'Member'
  const firstName = displayName.split(' ')[0]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Full-width Header */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-center">
          <Link href="/">
            <img
              src="/images/logo.png"
              alt="Diaspora Vote"
              className="mx-auto mb-6 h-16 w-16 rounded-lg object-contain hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome to Diaspora Vote
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            &ldquo;Think Local, go global!&rdquo;
          </p>
        </div>
      </div>

      {/* Message Body */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-6">
            Dear <strong className="text-slate-900">{displayName}</strong>,
          </p>

          <p className="text-base text-slate-700 leading-relaxed mb-6">
            Thank you for joining the <strong>Diaspora Vote (DV)</strong>.
          </p>

          <p className="text-base text-slate-700 leading-relaxed mb-6">
            By choosing to join, you are part of a community focused on{' '}
            <strong className="text-slate-900">diaspora civic engagement and democratic participation</strong>{' '}
            for Zimbabwe &mdash; connecting citizens abroad with transparent, peaceful ways to stay informed and involved.
          </p>

          <p className="text-base text-slate-700 leading-relaxed mb-6">
            Diaspora Vote is non-partisan: we strengthen links between Zimbabweans overseas and democratic
            processes at home, and we promote accountability and reliable information &mdash; without competing for political office.
          </p>

          <p className="text-base text-slate-700 leading-relaxed mb-4">
            Together we work to:
          </p>

          <ul className="mb-6 space-y-3">
            {[
              'Expand diaspora access to information and participation',
              'Promote free, fair, and peaceful democratic processes',
              'Support lawful civic participation and accountability',
              'Build solidarity across the global Zimbabwean community',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-base text-slate-700">{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-base text-slate-700 leading-relaxed mb-6">
            Stay engaged through our programmes, share accurate information from our official channels, and invite others in the diaspora to take part. Our strength is citizens acting together.
          </p>

          {/* Highlight Quote */}
          <div className="mb-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 py-4 px-5">
            <p className="text-base sm:text-lg font-semibold italic text-slate-900">
              Think Local, go global!
            </p>
          </div>

          <p className="text-base text-slate-700 leading-relaxed mb-8">
            Your solidarity contribution of <strong className="text-slate-900">USD5 per month</strong> or{' '}
            <strong className="text-slate-900">USD60 per annum</strong> will help us reach as many of
            our compatriots at home.
          </p>

          {/* Signature */}
          <div className="mb-8 border-t border-slate-100 pt-6">
            <p className="text-base text-slate-700 mb-1">Warm regards,</p>
            <p className="text-base font-bold text-slate-900">Senator Jameson Zvidzai Timba</p>
            <p className="text-sm text-slate-500">Convenor</p>
            <p className="text-sm text-slate-500">Diaspora Vote (DV)</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={nextUrl || '/membership-application'}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              {nextUrl ? 'Continue →' : 'Apply for Membership →'}
            </Link>
            <button
              onClick={() => setDonationModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Donate
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal isOpen={donationModalOpen} onClose={() => setDonationModalOpen(false)} />

      {/* Footer */}
      <div className="border-t bg-slate-100 py-6 text-center">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Diaspora Vote. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  )
}
