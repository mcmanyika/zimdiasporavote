'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getReferralsByUser } from '@/lib/firebase/firestore'
import DashboardNav from '@/app/components/DashboardNav'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import type { Referral } from '@/types'
import { getSiteUrl } from '@/lib/branding'

function ReferralStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    signed_up: { label: 'Signed Up', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
    applied: { label: 'Applied', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    paid: { label: 'Paid ✓', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }
  const c = config[status] || { label: status, classes: 'bg-slate-50 text-slate-700 border-slate-200' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  )
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  const masked = name.length > 2 ? name[0] + '***' + name[name.length - 1] : name[0] + '***'
  return `${masked}@${domain}`
}

function ReferralsContent() {
  const { user, userProfile } = useAuth()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const referralCode = userProfile?.referralCode || ''
  const referralLink = referralCode ? `${getSiteUrl()}/signup?ref=${referralCode}` : ''

  useEffect(() => {
    async function load() {
      if (!user?.uid) return
      try {
        const data = await getReferralsByUser(user.uid)
        setReferrals(data)
      } catch (e) {
        console.error('Error loading referrals:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.uid])

  const signedUp = referrals.filter((r) => r.status === 'signed_up').length
  const applied = referrals.filter((r) => r.status === 'applied').length
  const paid = referrals.filter((r) => r.status === 'paid').length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = referralLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Referrals</h1>
          <p className="mt-1 text-sm text-slate-500">Invite friends to join Diaspora Vote and track their progress.</p>
        </div>

        {/* Referral Link Card */}
        <div className="mb-8 rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Your Referral Link</h2>
              <p className="mt-1 text-sm text-slate-300">Share this link with friends. When they sign up, apply, and pay — you&apos;ll see it here.</p>
            </div>
          </div>

          {referralCode ? (
            <div className="mt-5">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-mono text-slate-100 truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Your code: <span className="font-mono font-semibold text-slate-200">{referralCode}</span></p>
            </div>
          ) : (
            <div className="mt-5 rounded-lg bg-white/10 px-4 py-3 text-sm text-slate-300">
              Loading your referral code…
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Referrals</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{referrals.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Signed Up</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{signedUp}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Applied</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{applied}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Paid (Converted)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{paid}</p>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Referred Users</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-r-transparent" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-900">No referrals yet</p>
              <p className="mt-1 text-sm text-slate-500">Share your link to start inviting friends!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{r.referredName}</td>
                      <td className="px-6 py-3 text-slate-500">{maskEmail(r.referredEmail)}</td>
                      <td className="px-6 py-3"><ReferralStatusBadge status={r.status} /></td>
                      <td className="px-6 py-3 text-slate-500">
                        {r.createdAt instanceof Date ? r.createdAt.toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <ProtectedRoute>
      <ReferralsContent />
    </ProtectedRoute>
  )
}
