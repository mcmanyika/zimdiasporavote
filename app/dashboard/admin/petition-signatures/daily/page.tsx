'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { getPetitions } from '@/lib/firebase/firestore'
import type { Petition, PetitionSignature } from '@/types'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface FlatSignature extends PetitionSignature {
  petitionId: string
  petitionTitle: string
}

interface DailyRow {
  dateKey: string
  dateLabel: string
  total: number
  named: number
  anonymous: number
  members: number
  guests: number
}

function toDate(value: any): Date {
  if (value instanceof Date) return value
  if (value?.toDate) return value.toDate()
  return new Date(value)
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PetitionSignaturesDailyPage() {
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPetition, setSelectedPetition] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const petitionParam = params.get('petition')
    if (petitionParam) setSelectedPetition(petitionParam)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getPetitions(false, false)
        setPetitions(data)
      } catch (error) {
        console.error('Error loading petitions:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

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
    return sigs
  }, [petitions])

  const filtered = useMemo(
    () =>
      allSignatures.filter((sig) => {
        if (selectedPetition !== 'all' && sig.petitionId !== selectedPetition) return false

        const signedAt = toDate(sig.signedAt)
        if (Number.isNaN(signedAt.getTime())) return false

        if (startDate) {
          const from = new Date(`${startDate}T00:00:00`)
          if (signedAt < from) return false
        }
        if (endDate) {
          const to = new Date(`${endDate}T23:59:59.999`)
          if (signedAt > to) return false
        }

        return true
      }),
    [allSignatures, selectedPetition, startDate, endDate]
  )

  const byDay = useMemo(() => {
    const bucket: Record<string, DailyRow> = {}

    filtered.forEach((sig) => {
      const d = toDate(sig.signedAt)
      if (Number.isNaN(d.getTime())) return
      const dateKey = toLocalDateKey(d)
      if (!bucket[dateKey]) {
        bucket[dateKey] = {
          dateKey,
          dateLabel: d.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' }),
          total: 0,
          named: 0,
          anonymous: 0,
          members: 0,
          guests: 0,
        }
      }
      bucket[dateKey].total += 1
      if (sig.anonymous) bucket[dateKey].anonymous += 1
      else bucket[dateKey].named += 1
      if (sig.userId) bucket[dateKey].members += 1
      else bucket[dateKey].guests += 1
    })

    return Object.values(bucket).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
  }, [filtered])

  const chartData = useMemo(() => [...byDay].slice(0, 30).reverse(), [byDay])
  const selectedPetitionTitle =
    selectedPetition === 'all'
      ? 'All Petitions'
      : petitions.find((p) => p.id === selectedPetition)?.title || 'Selected Petition'

  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Daily Signature Breakdown</h1>
                <Link
                  href="/dashboard/admin/petition-signatures"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  ← Back to Signatures
                </Link>
              </div>
            </div>
          </div>

          <DashboardNav />

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                Loading daily breakdown...
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Scope</p>
                      <p className="text-base font-semibold text-slate-900">{selectedPetitionTitle}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select
                        value={selectedPetition}
                        onChange={(e) => setSelectedPetition(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="all">All Petitions</option>
                        {petitions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        aria-label="Start date"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        aria-label="End date"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-slate-900">Last 30 Active Days</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null
                            const row = payload[0].payload as DailyRow
                            return (
                              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                                <p className="font-semibold text-slate-900">{row.dateLabel}</p>
                                <p className="text-slate-600">Total: {row.total}</p>
                                <p className="text-slate-600">Named: {row.named}</p>
                                <p className="text-slate-600">Anonymous: {row.anonymous}</p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  {byDay.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No signature data available for this selection.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Named</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Anonymous</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Members</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Guests</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {byDay.map((row) => (
                            <tr key={row.dateKey} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{row.dateLabel}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{row.total}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{row.named}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{row.anonymous}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{row.members}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{row.guests}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}
