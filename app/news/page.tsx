'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import { getNews } from '@/lib/firebase/firestore'
import type { News } from '@/types'

const HERO_BG = "url('/images/hero_section.png')"

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 9

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true)
        const allNews = await getNews(true) // published only
        setNews(allNews)
      } catch (err) {
        console.error('Error loading news:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  const formatDate = (date: any) => {
    if (!date) return ''
    const d = date instanceof Date ? date : date?.toDate?.() || new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(news.map(n => n.category).filter(Boolean)))]

  // Filter news
  const filteredNews = news.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedNews = filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <Header />

      {/* Hero — same visual language as landing (photo + light scrim) */}
      <section className="relative overflow-hidden border-b border-slate-200/80 pt-24 pb-10 sm:pt-28 sm:pb-14">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: HERO_BG }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/78 to-dv-sky/45 sm:from-white/92 sm:via-white/72 sm:to-dv-sky/35" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-dv-navy/55">Latest articles</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-dv-navy sm:text-4xl">Updates & Announcements</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
            Stay informed about the latest developments, events, and announcements from the Diaspora Vote.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat as string)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-dv-navy text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-dv-navy/85 hover:border-slate-300'
                    }`}
                  >
                    {cat === 'all' ? 'All' : (cat as string).charAt(0).toUpperCase() + (cat as string).slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="bg-gradient-to-b from-white via-dv-sky/25 to-dv-sky/45 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-dv-navy border-r-transparent" />
                <p className="text-slate-600">Loading articles...</p>
              </div>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-500 shadow-sm">
                <Newspaper className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="mb-2 text-xl font-bold text-dv-navy">No Articles Found</h2>
              <p className="text-sm text-slate-600">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No articles at the moment. Check back later!'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="mt-6 inline-flex items-center rounded-full bg-dv-red px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dv-red-hover"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'} found
                  {totalPages > 1 && (
                    <span className="ml-1">· Page {currentPage} of {totalPages}</span>
                  )}
                </p>
              </div>
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                {paginatedNews.map((newsItem) => (
                  <Link
                    key={newsItem.id}
                    href={`/news/${newsItem.id}`}
                    className="group block rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md sm:p-5"
                  >
                    {/* Image */}
                    <div className="mb-3 overflow-hidden rounded-xl">
                      {newsItem.image ? (
                        <img
                          src={newsItem.image}
                          alt={newsItem.title}
                          className="h-40 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-dv-sky/60">
                          <img
                            src="/images/logo.png"
                            alt="Diaspora Vote"
                            className="h-16 w-16 object-contain opacity-40"
                          />
                        </div>
                      )}
                    </div>

                    {/* Category & Date */}
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      {newsItem.category && (
                        <span className="inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dv-navy/80 ring-1 ring-slate-200/80">
                          {newsItem.category}
                        </span>
                      )}
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-300 group-hover:text-slate-600">
                        {formatDate(newsItem.publishedAt || newsItem.createdAt)}
                      </p>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-sm font-bold text-dv-navy transition-colors duration-300 group-hover:text-blue-700 sm:text-base">
                      {newsItem.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 transition-colors duration-300 group-hover:text-slate-700 line-clamp-3">
                      {newsItem.description}
                    </p>

                    {/* Author */}
                    {newsItem.author && (
                      <p className="mt-3 text-[10px] text-slate-400">
                        By {newsItem.author}
                      </p>
                    )}

                    {/* Read More */}
                    <div className="mt-3 flex items-center text-xs font-semibold text-dv-navy opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      Read more
                      <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-dv-navy/90 transition-colors hover:bg-dv-sky/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                              currentPage === page
                                ? 'bg-dv-navy text-white shadow-sm'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-dv-sky/50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      }
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-1 text-slate-400">
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>

                  {/* Next */}
                  <button
                    onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-dv-navy/90 transition-colors hover:bg-dv-sky/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  )
}

