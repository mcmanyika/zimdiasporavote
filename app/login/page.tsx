'use client'

import { Suspense } from 'react'
import LoginForm from '@/app/components/LoginForm'
import ZimbabweFlagIcon from '@/app/components/ZimbabweFlagIcon'
import { SITE_NAME } from '@/lib/branding'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const signupHref = returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : '/signup'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <ZimbabweFlagIcon className="h-4 w-6 shrink-0 rounded-sm border border-slate-200/90 shadow-sm sm:h-5 sm:w-[30px]" />
            <Link href="/" className="inline-block">
              <img
                src="/images/logo.png"
                alt={SITE_NAME}
                className="h-12 w-auto rounded-md object-contain sm:h-16"
              />
            </Link>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href={signupHref} className="font-semibold text-slate-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}