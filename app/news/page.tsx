'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import { getNews } from '@/lib/firebase/firestore'
import type { News } from '@/types'

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
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Latest Articles</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Updates & Announcements</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Stay informed about the latest developments, events, and announcements from the Diaspora Vote.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as string)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
      <section className="bg-slate-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                <p className="text-slate-500">Loading articles...</p>
              </div>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4 text-6xl">📰</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">No Articles Found</h2>
              <p className="text-sm text-slate-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No articles at the moment. Check back later!'}
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}
                  className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">
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
                    className="group block rounded-lg border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-slate-900 hover:shadow-md sm:p-5"
                  >
                    {/* Image */}
                    <div className="mb-3 overflow-hidden rounded-md">
                      {newsItem.image ? (
                        <img
                          src={newsItem.image}
                          alt={newsItem.title}
                          className="h-40 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-slate-100">
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
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-full">
                          {newsItem.category}
                        </span>
                      )}
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-300 group-hover:text-slate-600">
                        {formatDate(newsItem.publishedAt || newsItem.createdAt)}
                      </p>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-sm font-bold transition-colors duration-300 group-hover:text-slate-900 sm:text-base">
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
                    <div className="mt-3 flex items-center text-xs font-semibold text-slate-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                            className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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

