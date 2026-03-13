'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function CTASection() {
  const { user, userProfile } = useAuth()

  const isExistingMember = Boolean(
    user &&
    userProfile &&
    (
      userProfile.membershipTier !== 'free' ||
      userProfile.role === 'member' ||
      userProfile.role === 'moderator' ||
      userProfile.role === 'admin'
    )
  )

  if (isExistingMember) return null

  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">Join Our Movement</h2>
        <p className="mb-6 text-sm text-slate-300 sm:text-base">
          Stand with us in defending the Constitution and protecting democratic values for all Zimbabweans.
        </p>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
          >
            Join the Platform
          </Link>
          <Link
            href="/#contact"
            className="inline-flex w-full items-center justify-center rounded-md border-2 border-white px-5 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  )
}
