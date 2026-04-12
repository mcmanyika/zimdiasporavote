'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/DashboardNav'
import Link from 'next/link'
import {
  getAllMemberships,
  getMembershipApplications,
  getAllUsers,
} from '@/lib/firebase/firestore'
import type { Membership, MembershipApplication, UserProfile } from '@/types'

function toDate(date: Date | any): Date | null {
  if (!date) return null
  if (date instanceof Date) return date
  if (date && typeof date === 'object' && 'toDate' in date) {
    return (date as any).toDate()
  }
  return new Date(date as string | number)
}

interface CardData {
  userId: string
  memberName: string
  membershipNumber: string
  province?: string
  dateJoined: string
  expiryDate: string
  photoURL?: string
  email?: string
  tier: string
  paymentStatus: 'paid' | 'unpaid'
  applicationStatus: string
}

const PAGE_SIZE = 10

export default function AdminMembershipCardsPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [previewCard, setPreviewCard] = useState<CardData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userProfile, router])

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    setLoading(true)
    try {
      const [memberships, applications, users] = await Promise.all([
        getAllMemberships(),
        getMembershipApplications(),
        getAllUsers(),
      ])

      // Build lookup maps
      const userMap = new Map<string, UserProfile>()
      users.forEach((u) => userMap.set(u.uid, u))

      // Build membership lookup by userId (most recent succeeded payment)
      const membershipByUser = new Map<string, Membership>()
      memberships.forEach((m) => {
        if (m.status === 'succeeded' && !membershipByUser.has(m.userId)) {
          membershipByUser.set(m.userId, m)
        }
      })

      // Build card data from ALL approved applications with membership numbers
      const cardList: CardData[] = []

      applications.forEach((app) => {
        if (!app.userId || !app.membershipNumber) return
        // Include approved (and pending/rejected too if they have a membership number assigned)
        // But primarily we want those with a membership number

        const user = userMap.get(app.userId)
        const membership = membershipByUser.get(app.userId)

        const memberName =
          app.type === 'individual'
            ? app.fullName || user?.name || 'Unknown'
            : app.organisationName || user?.name || 'Unknown'

        const province =
          app.type === 'individual'
            ? app.provinceAllocated || app.province
            : app.provinceAllocated || app.provincesOfOperation

        // Use membership payment date if paid, otherwise application date
        const paymentDate = membership ? toDate(membership.createdAt) : null
        const appDate = toDate(app.createdAt)
        const referenceDate = paymentDate || appDate

        const dateJoined = referenceDate
          ? referenceDate.toLocaleDateString('en-ZW', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—'

        const expiryDate = paymentDate
          ? new Date(
              paymentDate.getFullYear() + 1,
              paymentDate.getMonth(),
              paymentDate.getDate()
            ).toLocaleDateString('en-ZW', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'Pending Payment'

        cardList.push({
          userId: app.userId,
          memberName,
          membershipNumber: app.membershipNumber,
          province,
          dateJoined,
          expiryDate,
          photoURL: user?.photoURL || undefined,
          email: user?.email || app.emailAddress || app.representativeEmail,
          tier: membership?.tier || 'free',
          paymentStatus: membership ? 'paid' : 'unpaid',
          applicationStatus: app.status,
        })
      })

      setCards(cardList)
    } catch (err) {
      console.error('Error loading membership cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const paidCount = cards.filter((c) => c.paymentStatus === 'paid').length
  const unpaidCount = cards.filter((c) => c.paymentStatus === 'unpaid').length

  const filteredCards = cards.filter((card) => {
    if (filter !== 'all' && card.paymentStatus !== filter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      card.memberName.toLowerCase().includes(q) ||
      card.membershipNumber.toLowerCase().includes(q) ||
      (card.email && card.email.toLowerCase().includes(q)) ||
      (card.province && card.province.toLowerCase().includes(q))
    )
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE))
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredCards.slice(start, start + PAGE_SIZE)
  }, [filteredCards, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter])

  const handlePrintCard = (card: CardData) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print the membership card.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Diaspora Vote Membership Card - ${card.memberName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .card-wrapper {
            display: flex;
            flex-direction: column;
            gap: 24px;
            align-items: center;
          }
          .card {
            width: 400px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          }
          .card-front {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: white;
            padding: 24px;
            position: relative;
          }
          .card-front::before {
            content: '';
            position: absolute;
            top: -40px;
            right: -40px;
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background: rgba(255,255,255,0.04);
          }
          .card-front::after {
            content: '';
            position: absolute;
            bottom: -60px;
            left: -40px;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: rgba(255,255,255,0.03);
          }
          .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
          }
          .card-logo {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            object-fit: contain;
          }
          .card-org-name { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
          .card-org-sub { font-size: 10px; color: #94a3b8; letter-spacing: 0.5px; }
          .card-body {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            position: relative;
            z-index: 1;
          }
          .card-photo {
            width: 72px;
            height: 88px;
            border-radius: 8px;
            background: #475569;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
          }
          .card-photo-placeholder {
            width: 72px;
            height: 88px;
            border-radius: 8px;
            background: #475569;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255,255,255,0.2);
            flex-shrink: 0;
            color: #ffffff;
            font-weight: 700;
            font-size: 28px;
          }
          .card-info { flex: 1; }
          .card-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; line-height: 1.2; }
          .card-number { font-size: 11px; color: #94a3b8; margin-bottom: 12px; font-family: monospace; letter-spacing: 1px; }
          .card-detail-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .card-detail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
          .card-detail-value { font-size: 11px; font-weight: 600; }
          .card-footer {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
          }
          .card-badge {
            font-size: 10px;
            font-weight: 700;
            background: rgba(16,185,129,0.2);
            color: #6ee7b7;
            padding: 3px 10px;
            border-radius: 99px;
            letter-spacing: 0.5px;
          }
          .card-id-text { font-size: 9px; color: #64748b; }
          .card-back { background: #f8fafc; padding: 24px; color: #1e293b; }
          .card-back-header { text-align: center; margin-bottom: 16px; }
          .card-back-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
          .card-back-subtitle { font-size: 10px; color: #64748b; margin-top: 2px; }
          .card-terms { font-size: 9px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
          .card-terms li { margin-bottom: 4px; padding-left: 4px; }
          .card-back-footer { text-align: center; padding-top: 12px; border-top: 1px solid #e2e8f0; }
          .card-back-footer p { font-size: 9px; color: #94a3b8; }
          .card-back-footer a { color: #0f172a; font-weight: 600; text-decoration: none; }
          @media print { body { background: white; } .card { box-shadow: none; border: 1px solid #e2e8f0; } }
        </style>
      </head>
      <body>
        <div class="card-wrapper">
          <div class="card">
            <div class="card-front">
              <div class="card-header">
                <img src="${window.location.origin}/images/logo.png" class="card-logo" alt="Diaspora Vote" />
                <div>
                  <div class="card-org-name">Diaspora Vote</div>
                  <div class="card-org-sub">Official Membership Card</div>
                </div>
              </div>
              <div class="card-body">
                <div class="card-photo-placeholder">${card.memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div class="card-info">
                  <div class="card-name">${card.memberName}</div>
                  <div class="card-number">${card.membershipNumber}</div>
                  <div class="card-detail-row">
                    <div>
                      <div class="card-detail-label">Member Since</div>
                      <div class="card-detail-value">${card.dateJoined}</div>
                    </div>
                    <div style="text-align:right">
                      <div class="card-detail-label">Valid Until</div>
                      <div class="card-detail-value">${card.expiryDate}</div>
                    </div>
                  </div>
                  ${card.province ? `
                  <div style="margin-top:4px">
                    <div class="card-detail-label">Province</div>
                    <div class="card-detail-value">${card.province}</div>
                  </div>` : ''}
                </div>
              </div>
              <div class="card-footer">
                <div class="card-badge">${card.paymentStatus === 'paid' ? '✓ ACTIVE MEMBER' : '⏳ PAYMENT PENDING'}</div>
                <div class="card-id-text">diasporavote.org</div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-back">
              <div class="card-back-header">
                <div class="card-back-title">Diaspora Vote</div>
                <div class="card-back-subtitle">Membership Terms & Conditions</div>
              </div>
              <ol class="card-terms">
                <li>This card is the property of the Diaspora Vote (DV).</li>
                <li>The holder is a registered member committed to defending constitutional supremacy.</li>
                <li>This card is non-transferable and must be presented upon request at Diaspora Vote events.</li>
                <li>Membership is valid for one year from the date of issue and subject to renewal.</li>
                <li>Lost or damaged cards should be reported to Diaspora Vote administration immediately.</li>
              </ol>
              <div class="card-back-footer">
                <p>&ldquo;Think Local, go global!&rdquo;</p>
                <p style="margin-top:8px"><a href="https://diasporavote.org">diasporavote.org</a></p>
                <p style="margin-top:4px">&copy; ${new Date().getFullYear()} DV. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  if (userProfile && userProfile.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Membership Cards</h1>
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
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            onClick={() => setFilter('all')}
            className={`cursor-pointer rounded-lg border p-4 shadow-sm transition-colors ${filter === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white hover:bg-slate-50'}`}
          >
            <p className={`text-xs ${filter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>Total Cards</p>
            <p className="text-2xl font-bold">{cards.length}</p>
          </div>
          <div
            onClick={() => setFilter('paid')}
            className={`cursor-pointer rounded-lg border p-4 shadow-sm transition-colors ${filter === 'paid' ? 'border-green-700 bg-green-700 text-white' : 'bg-white hover:bg-slate-50'}`}
          >
            <p className={`text-xs ${filter === 'paid' ? 'text-green-200' : 'text-green-600'}`}>Paid</p>
            <p className={`text-2xl font-bold ${filter === 'paid' ? '' : 'text-green-700'}`}>{paidCount}</p>
          </div>
          <div
            onClick={() => setFilter('unpaid')}
            className={`cursor-pointer rounded-lg border p-4 shadow-sm transition-colors ${filter === 'unpaid' ? 'border-amber-600 bg-amber-600 text-white' : 'bg-white hover:bg-slate-50'}`}
          >
            <p className={`text-xs ${filter === 'unpaid' ? 'text-amber-200' : 'text-amber-600'}`}>Unpaid</p>
            <p className={`text-2xl font-bold ${filter === 'unpaid' ? '' : 'text-amber-700'}`}>{unpaidCount}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">Search</p>
            <input
              type="text"
              placeholder="Name, number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
              <p className="text-sm text-slate-500">Loading membership cards...</p>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <div className="mb-3 text-4xl">🪪</div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">No Cards Found</h3>
            <p className="text-sm text-slate-500">
              {search
                ? 'No membership cards match your search.'
                : 'No members with assigned membership numbers yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table view */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Card Number</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Province</th>
                    <th className="px-4 py-3 hidden md:table-cell">Member Since</th>
                    <th className="px-4 py-3 hidden md:table-cell">Expires</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCards.map((card) => (
                    <tr key={card.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                            {card.memberName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{card.memberName}</p>
                            <p className="text-[11px] text-slate-400">{card.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs tracking-wider text-slate-700">
                          {card.membershipNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                        {card.province || '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                        {card.dateJoined}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                        {card.expiryDate}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {card.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewCard(card)}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            title="Preview card"
                          >
                            <svg className="h-3.5 w-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            View
                          </button>
                          <button
                            onClick={() => handlePrintCard(card)}
                            className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                            title="Print card"
                          >
                            <svg className="h-3.5 w-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                            </svg>
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm text-slate-600">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCards.length)} of {filteredCards.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (page === 1 || page === totalPages) return true
                        if (Math.abs(page - currentPage) <= 1) return true
                        return false
                      })
                      .reduce<(number | string)[]>((acc, page, idx, arr) => {
                        if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...')
                        acc.push(page)
                        return acc
                      }, [])
                      .map((item, idx) =>
                        typeof item === 'string' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400">…</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                              currentPage === item
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setPreviewCard(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="mb-4 text-lg font-bold text-slate-900">Card Preview</h3>

            {/* Front */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.04]" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/[0.03]" />

              <div className="relative z-10 mb-5 flex items-center gap-3">
                <img src="/images/logo.png" alt="Diaspora Vote" className="h-11 w-11 rounded-xl object-contain" />
                <div>
                  <p className="text-sm font-bold tracking-wide">Diaspora Vote</p>
                  <p className="text-[10px] tracking-wider text-slate-400">Official Membership Card</p>
                </div>
              </div>

              <div className="relative z-10 flex gap-4">
                <div className="flex h-[88px] w-[72px] shrink-0 items-center justify-center rounded-lg border-2 border-white/20 bg-slate-600 text-2xl font-bold text-white">
                  {previewCard.memberName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold leading-tight">{previewCard.memberName}</h3>
                  <p className="mb-3 font-mono text-[11px] tracking-widest text-slate-400">{previewCard.membershipNumber}</p>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">Member Since</p>
                      <p className="text-[11px] font-semibold">{previewCard.dateJoined}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">Valid Until</p>
                      <p className="text-[11px] font-semibold">{previewCard.expiryDate}</p>
                    </div>
                  </div>
                  {previewCard.province && (
                    <div className="mt-1">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">Province</p>
                      <p className="text-[11px] font-semibold">{previewCard.province}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                {previewCard.paymentStatus === 'paid' ? (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-300">
                    ✓ ACTIVE MEMBER
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-bold tracking-wider text-amber-300">
                    ⏳ PAYMENT PENDING
                  </span>
                )}
                <span className="text-[9px] text-slate-500">diasporavote.org</span>
              </div>
            </div>

            {/* Back */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xl">
              <div className="mb-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-900">Diaspora Vote</p>
                <p className="text-[10px] text-slate-500">Membership Terms & Conditions</p>
              </div>
              <ol className="mb-4 list-decimal space-y-1 pl-4 text-[9px] leading-relaxed text-slate-600">
                <li>This card is the property of the Diaspora Vote (DV).</li>
                <li>The holder is a registered member committed to defending constitutional supremacy.</li>
                <li>This card is non-transferable and must be presented upon request at Diaspora Vote events.</li>
                <li>Membership is valid for one year from the date of issue and subject to renewal.</li>
                <li>Lost or damaged cards should be reported to Diaspora Vote administration immediately.</li>
              </ol>
              <div className="border-t border-slate-200 pt-3 text-center">
                <p className="text-[9px] italic text-slate-500">&ldquo;Think Local, go global!&rdquo;</p>
                <p className="mt-2 text-[9px] font-semibold text-slate-700">diasporavote.org</p>
                <p className="text-[9px] text-slate-400">&copy; {new Date().getFullYear()} DV. All rights reserved.</p>
              </div>
            </div>

            {/* Print button in modal */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handlePrintCard(previewCard)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Print This Card
              </button>
              <button
                onClick={() => setPreviewCard(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
