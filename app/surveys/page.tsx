'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { getSurveys } from '@/lib/firebase/firestore'
import type { Survey, SurveyCategory } from '@/types'

const ITEMS_PER_PAGE = 9

const categoryLabels: Record<SurveyCategory, string> = {
  governance: 'Governance',
  rights: 'Rights',
  community: 'Community',
  policy: 'Policy',
  general: 'General',
}

const categoryColors: Record<SurveyCategory, string> = {
  governance: 'bg-blue-100 text-blue-700',
  rights: 'bg-purple-100 text-purple-700',
  community: 'bg-green-100 text-green-700',
  policy: 'bg-orange-100 text-orange-700',
  general: 'bg-slate-100 text-slate-700',
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        setLoading(true)
        const allSurveys = await getSurveys('published')
        setSurveys(allSurveys)
      } catch (error) {
        console.error('Error loading surveys:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSurveys()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, categoryFilter, searchQuery])

  const filteredSurveys = surveys.filter(survey => {
    if (statusFilter !== 'all' && survey.status !== statusFilter) return false
    if (categoryFilter !== 'all' && survey.category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return survey.title.toLowerCase().includes(q) || survey.description.toLowerCase().includes(q)
    }
    return true
  })

  const totalPages = Math.ceil(filteredSurveys.length / ITEMS_PER_PAGE)
  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const isExpired = (survey: Survey) => {
    if (!survey.deadline) return false
    const deadline = survey.deadline instanceof Date ? survey.deadline : new Date()
    return deadline < new Date()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Surveys</h1>
              <p className="text-sm text-slate-300 sm:text-base">
                Your voice matters. Participate in our surveys to help shape policy priorities.
              </p>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="text-sm text-slate-500">Loading surveys...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Surveys</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Your voice matters. Participate in our surveys to help shape policy priorities.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'closed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'active' ? '🟢 Active' : '🔴 Closed'}
                </button>
              ))}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search surveys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 sm:w-64"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Survey Cards */}
          {filteredSurveys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No surveys found.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedSurveys.map((survey) => {
                  const expired = isExpired(survey)
                  const isClosed = survey.status === 'closed' || expired
                  const progress = survey.responseGoal
                    ? Math.min(100, Math.round((survey.responseCount / survey.responseGoal) * 100))
                    : null

                  return (
                    <Link
                      key={survey.id}
                      href={`/surveys/${survey.id}`}
                      className="group block rounded-lg border border-slate-200 bg-white p-5 transition-all hover:border-slate-900 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[survey.category]}`}>
                          {categoryLabels[survey.category]}
                        </span>
                        <span className={`text-[10px] font-semibold ${isClosed ? 'text-red-500' : 'text-green-500'}`}>
                          {isClosed ? '● Closed' : '● Active'}
                        </span>
                      </div>

                      <h3 className="mb-2 text-base font-bold group-hover:text-slate-900 line-clamp-2">
                        {survey.title}
                      </h3>
                      <p className="mb-4 text-xs text-slate-600 line-clamp-2">
                        {survey.description}
                      </p>

                      {/* Response count & progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>{survey.responseCount} response{survey.responseCount !== 1 ? 's' : ''}</span>
                          {survey.responseGoal && (
                            <span>Goal: {survey.responseGoal}</span>
                          )}
                        </div>
                        {progress !== null && (
                          <div className="h-1.5 w-full rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-slate-900 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}</span>
                        {survey.deadline && (
                          <span>
                            {isClosed ? 'Ended' : 'Deadline'}:{' '}
                            {new Date(
                              survey.deadline instanceof Date
                                ? survey.deadline.getTime()
                                : (survey.deadline as any)?.toMillis?.() || 0
                            ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}

      {/* Footer */}
      <Footer />
    </main>
  )
}

