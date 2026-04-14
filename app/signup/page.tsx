'use client'

import { Suspense } from 'react'
import SignupForm from '@/app/components/SignupForm'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/branding'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SignupContent() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const refCode = searchParams.get('ref') || undefined
  const loginHref = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/"><img src="/images/logo.png" alt={SITE_NAME} className="mx-auto mb-4 h-16 w-16 rounded-md object-contain hover:opacity-80 transition-opacity cursor-pointer" /></Link>
          <h1 className="mb-2 text-3xl font-bold">Create Account</h1>
          <p className="text-slate-600">Join {SITE_NAME} — {SITE_TAGLINE}</p>
          {refCode && (
            <p className="mt-2 text-sm text-emerald-600 font-medium">You&apos;ve been invited! Sign up to get started.</p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <SignupForm referralCode={refCode} />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href={loginHref} className="font-semibold text-slate-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
