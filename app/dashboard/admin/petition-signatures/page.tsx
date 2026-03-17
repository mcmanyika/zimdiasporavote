'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import Link from 'next/link'
import { getPetitions } from '@/lib/firebase/firestore'
import type { Petition, PetitionSignature } from '@/types'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const PIE_COLORS = ['#0f172a', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

interface FlatSignature extends PetitionSignature {
  petitionId: string
  petitionTitle: string
}

type SortField = 'name' | 'email' | 'petition' | 'signedAt' | 'type'
type SortDir = 'asc' | 'desc'

function toDateVal(date: any): number {
  if (date instanceof Date) return date.getTime()
  if (date && typeof date === 'object' && 'toDate' in date) return date.toDate().getTime()
  return new Date(date as any).getTime()
}

function formatDate(date: Date | any): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('en-ZW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PetitionSignaturesPage() {
  const router = useRouter()
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPetition, setSelectedPetition] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('signedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const ITEMS_PER_PAGE = 10

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col leading-none">
      <svg className={`h-2 w-2 ${sortField === field && sortDir === 'asc' ? 'text-slate-900' : 'text-slate-300'}`} viewBox="0 0 8 5" fill="currentColor"><path d="M4 0l4 5H0z" /></svg>
      <svg className={`h-2 w-2 ${sortField === field && sortDir === 'desc' ? 'text-slate-900' : 'text-slate-300'}`} viewBox="0 0 8 5" fill="currentColor"><path d="M4 5L0 0h8z" /></svg>
    </span>
  )

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPetitions(false, false)
        setPetitions(data)
      } catch (err) {
        console.error('Error loading petitions:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Flatten all signatures across all petitions
  const allSignatures: FlatSignature[] = useMemo(() => {
    const sigs: FlatSignature[] = []
    petitions.forEach((p) => {
      ;(p.signatures || []).forEach((sig) => {
        sigs.push({
          ...sig,
          petitionId: p.id,
          petitionTitle: p.title,
        })
      })
    })
    // Sort by signedAt descending
    sigs.sort((a, b) => {
      const dateA = a.signedAt instanceof Date ? a.signedAt.getTime() : new Date(a.signedAt as any).getTime()
      const dateB = b.signedAt instanceof Date ? b.signedAt.getTime() : new Date(b.signedAt as any).getTime()
      return dateB - dateA
    })
    return sigs
  }, [petitions])

  // Filter signatures
  const filtered = useMemo(() => {
    return allSignatures.filter((sig) => {
      if (selectedPetition !== 'all' && sig.petitionId !== selectedPetition) return false
      if (search) {
        const s = search.toLowerCase()
        const name = sig.anonymous ? 'anonymous' : (sig.name || '').toLowerCase()
        const email = (sig.email || '').toLowerCase()
        const petition = (sig.petitionTitle || '').toLowerCase()
        if (!name.includes(s) && !email.includes(s) && !petition.includes(s)) return false
      }
      return true
    })
  }, [allSignatures, selectedPetition, search])

  // Sort filtered results
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': {
          const nameA = a.anonymous ? '' : (a.name || '').toLowerCase()
          const nameB = b.anonymous ? '' : (b.name || '').toLowerCase()
          cmp = nameA.localeCompare(nameB)
          break
        }
        case 'email':
          cmp = (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase())
          break
        case 'petition':
          cmp = (a.petitionTitle || '').toLowerCase().localeCompare((b.petitionTitle || '').toLowerCase())
          break
        case 'signedAt':
          cmp = toDateVal(a.signedAt) - toDateVal(b.signedAt)
          break
        case 'type': {
          const typeA = a.userId ? 1 : 0
          const typeB = b.userId ? 1 : 0
          cmp = typeA - typeB
          break
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortField, sortDir])

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedPetition])

  // Summary stats
  const totalSignatures = allSignatures.length
  const uniqueEmails = useMemo(() => new Set(allSignatures.map((s) => s.email.toLowerCase())).size, [allSignatures])
  const anonymousCount = useMemo(() => allSignatures.filter((s) => s.anonymous).length, [allSignatures])

  // Chart: Signatures per petition
  const signaturesPerPetition = useMemo(() => {
    return petitions
      .map((p) => ({
        name: p.title.length > 25 ? p.title.slice(0, 25) + '…' : p.title,
        fullName: p.title,
        signatures: p.signatures?.length || 0,
        goal: p.goal,
      }))
      .sort((a, b) => b.signatures - a.signatures)
  }, [petitions])

  // Chart: Member vs Guest pie
  const memberVsGuest = useMemo(() => {
    const members = allSignatures.filter((s) => s.userId).length
    const guests = allSignatures.length - members
    return [
      { name: 'Members', value: members, color: '#10b981' },
      { name: 'Guests', value: guests, color: '#64748b' },
    ].filter((d) => d.value > 0)
  }, [allSignatures])

  // Chart: Anonymous vs Named pie
  const anonVsNamed = useMemo(() => {
    const anon = allSignatures.filter((s) => s.anonymous).length
    const named = allSignatures.length - anon
    return [
      { name: 'Named', value: named, color: '#0f172a' },
      { name: 'Anonymous', value: anon, color: '#f59e0b' },
    ].filter((d) => d.value > 0)
  }, [allSignatures])

  // Chart: Signatures over time (last 6 months)
  const signaturesOverTime = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      months.push({ key, label })
    }

    const countsByMonth: Record<string, number> = {}
    months.forEach((m) => { countsByMonth[m.key] = 0 })

    allSignatures.forEach((sig) => {
      const d = sig.signedAt instanceof Date ? sig.signedAt : (sig.signedAt as any).toDate ? (sig.signedAt as any).toDate() : new Date(sig.signedAt as any)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (countsByMonth[key] !== undefined) {
        countsByMonth[key]++
      }
    })

    return months.map((m) => ({
      month: m.label,
      signatures: countsByMonth[m.key],
    }))
  }, [allSignatures])

  // Custom tooltip for pie charts
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const total = data.total || allSignatures.length
      const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0'
      return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-slate-600">{data.value} ({pct}%)</p>
        </div>
      )
    }
    return null
  }

  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Petition Signatures</h1>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          <DashboardNav />

          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
                  <p className="text-sm text-slate-500">Loading signatures...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Total Signatures</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{totalSignatures.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Unique Signers</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{uniqueEmails.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Anonymous</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{anonymousCount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Petitions</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{petitions.length}</p>
                  </div>
                </div>

                {/* Charts */}
                {allSignatures.length > 0 && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Member vs Guest */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-bold text-slate-900">Member vs Guest</h3>
                      <div className="h-48">
                        {memberVsGuest.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={memberVsGuest.map((d) => ({ ...d, total: allSignatures.length }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {memberVsGuest.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap justify-center gap-3">
                        {memberVsGuest.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-xs text-slate-600">{d.name} ({d.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Anonymous vs Named */}
                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="mb-4 text-sm font-bold text-slate-900">Anonymous vs Named</h3>
                      <div className="h-48">
                        {anonVsNamed.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={anonVsNamed.map((d) => ({ ...d, total: allSignatures.length }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {anonVsNamed.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<PieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap justify-center gap-3">
                        {anonVsNamed.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-xs text-slate-600">{d.name} ({d.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Signatures Over Time */}
                    <div
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                      onClick={() => {
                        const qs = selectedPetition !== 'all' ? `?petition=${encodeURIComponent(selectedPetition)}` : ''
                        router.push(`/dashboard/admin/petition-signatures/daily${qs}`)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          const qs = selectedPetition !== 'all' ? `?petition=${encodeURIComponent(selectedPetition)}` : ''
                          router.push(`/dashboard/admin/petition-signatures/daily${qs}`)
                        }
                      }}
                      aria-label="Open daily signature breakdown page"
                    >
                      <h3 className="mb-1 text-sm font-bold text-slate-900">Signatures Over Time</h3>
                      <p className="mb-3 text-xs text-slate-500">Click to view daily breakdown</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={signaturesOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                            <Tooltip
                              content={({ active, payload }: any) => {
                                if (active && payload?.length) {
                                  return (
                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                                      <p className="font-semibold text-slate-900">{payload[0].payload.month}</p>
                                      <p className="text-slate-600">{payload[0].value} signatures</p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Bar dataKey="signatures" fill="#0f172a" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search by name, email, or petition..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <select
                      value={selectedPetition}
                      onChange={(e) => setSelectedPetition(e.target.value)}
                      className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="all">All Petitions ({totalSignatures})</option>
                      {petitions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.signatures?.length || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  {search && (
                    <p className="mt-2 text-xs text-slate-500">
                      {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
                    </p>
                  )}
                </div>

                {/* Signatures Table */}
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  {filtered.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      {search || selectedPetition !== 'all'
                        ? 'No signatures match your filters.'
                        : 'No signatures yet.'}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                #
                              </th>
                              <th
                                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                onClick={() => handleSort('name')}
                              >
                                <span className="inline-flex items-center">Name <SortIcon field="name" /></span>
                              </th>
                              <th
                                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                onClick={() => handleSort('email')}
                              >
                                <span className="inline-flex items-center">Email <SortIcon field="email" /></span>
                              </th>
                              <th
                                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                onClick={() => handleSort('petition')}
                              >
                                <span className="inline-flex items-center">Petition <SortIcon field="petition" /></span>
                              </th>
                              <th
                                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                onClick={() => handleSort('signedAt')}
                              >
                                <span className="inline-flex items-center">Signed At <SortIcon field="signedAt" /></span>
                              </th>
                              <th
                                className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                onClick={() => handleSort('type')}
                              >
                                <span className="inline-flex items-center">Type <SortIcon field="type" /></span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paginated.map((sig, idx) => (
                              <tr key={`${sig.petitionId}-${sig.email}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                                  {startIndex + idx + 1}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  {sig.anonymous ? (
                                    <span className="text-sm italic text-slate-400">Anonymous</span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                        {sig.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                      <span className="text-sm font-medium text-slate-900">{sig.name}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                                  {sig.email}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-block max-w-[200px] truncate text-sm text-slate-700" title={sig.petitionTitle}>
                                    {sig.petitionTitle}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                                  {formatDate(sig.signedAt)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  {sig.userId ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      Member
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      Guest
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs text-slate-500">
                            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, sorted.length)} of{' '}
                            {sorted.length}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 2 && page <= currentPage + 2)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                                      currentPage === page
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                )
                              }
                              if (
                                (page === currentPage - 3 && currentPage > 4) ||
                                (page === currentPage + 3 && currentPage < totalPages - 3)
                              ) {
                                return (
                                  <span key={page} className="px-2 text-xs text-slate-400">
                                    …
                                  </span>
                                )
                              }
                              return null
                            })}
                            <button
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}
