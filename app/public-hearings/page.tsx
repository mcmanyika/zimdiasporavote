'use client'

import { useEffect, useMemo, useState } from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import { getPublicHearings } from '@/lib/firebase/firestore'
import type { PublicHearing } from '@/types'

export default function PublicHearingsPage() {
  const pageSize = 10
  const billsEmail = 'bills@parlzim.gov.zw'
  const emailSubject = 'Public Submission – Constitution Amendment Bill, 2026'
  const emailBody = `Dear Clerk of Parliament,

I write as a citizen to oppose amendments that extend tenure, remove direct presidential elections, weaken ZEC, alter the role of the Defence Forces, politicise traditional leaders, or dissolve independent commissions.
The 2013 Constitution was adopted by referendum. Any change affecting tenure or how leaders are elected must be approved by the people through a referendum.
I respectfully urge Parliament to reject the Bill in its current form and preserve Zimbabwe's democratic safeguards.

Name:
Province:
Contact:`
  const [hearings, setHearings] = useState<PublicHearing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadHearings = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await getPublicHearings({ publishedOnly: true })
        setHearings(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load public hearings.')
      } finally {
        setLoading(false)
      }
    }
    void loadHearings()
  }, [])

  const provinces = useMemo(() => {
    const unique = Array.from(new Set(hearings.map((item) => item.province).filter(Boolean)))
    return unique.sort((a, b) => a.localeCompare(b))
  }, [hearings])

  const filteredHearings = useMemo(() => {
    return hearings.filter((item) => provinceFilter === 'all' || item.province === provinceFilter)
  }, [hearings, provinceFilter])

  const totalPages = Math.max(1, Math.ceil(filteredHearings.length / pageSize))
  const paginatedHearings = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredHearings.slice(start, start + pageSize)
  }, [filteredHearings, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [provinceFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-10 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Parliament Tracking</p>
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Upcoming Public Hearings</h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
            Stay informed about upcoming public hearings and where they will be held.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Constitution of Zimbabwe Amendment (No. 3) Bill Public Hearing</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <span>Province:</span>
                  <select
                    value={provinceFilter}
                    onChange={(e) => setProvinceFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                  >
                    <option value="all">All</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </label>
                <a
                  href={`mailto:${billsEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Email Parliament
                </a>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-600">
              Loading hearings...
            </div>
          ) : filteredHearings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-600">
              No published hearings found.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedHearings.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center justify-end gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                    <p><span className="font-semibold text-slate-900">Date:</span> {formatDate(item.scheduledDate)}</p>
                    <p><span className="font-semibold text-slate-900">Time:</span> {item.startTime || 'TBC'}</p>
                    <p><span className="font-semibold text-slate-900">Province:</span> {item.province}</p>
                    <p><span className="font-semibold text-slate-900">District:</span> {item.district}</p>
                    <p><span className="font-semibold text-slate-900">Place:</span> {item.locationName || 'TBC'}</p>
                    <p><span className="font-semibold text-slate-900">Venue:</span> {item.venue}</p>
                  </div>
                  {item.teamCode && (
                    <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-700">
                      {item.teamCode && <p><span className="font-semibold text-slate-900">Team:</span> {item.teamCode}</p>}
                    </div>
                  )}
                </article>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <p className="text-slate-600">
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredHearings.length)} of {filteredHearings.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}

function formatDate(value: Date | any): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBC'
  return date.toLocaleDateString()
}
