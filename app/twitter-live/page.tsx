'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import { getPublicTwitterEmbeds } from '@/lib/firebase/firestore'
import type { TwitterEmbedPost } from '@/types'

function formatDate(date: Date | any): string {
  if (!date) return ''
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const ITEMS_PER_PAGE = 6

export default function TwitterLivePage() {
  const [embeds, setEmbeds] = useState<TwitterEmbedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetsLoaded = useRef(false)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getPublicTwitterEmbeds()
        setEmbeds(data)
      } catch (err) {
        console.error('Error loading twitter embeds:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load twitter widgets script once embeds are rendered
  useEffect(() => {
    if (loading || embeds.length === 0) return

    const loadWidgets = () => {
      if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(containerRef.current)
        widgetsLoaded.current = true
      }
    }

    const scriptId = 'twitter-widgets-js'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      document.body.appendChild(script)
      script.onload = loadWidgets
    } else {
      // Script already loaded, just re-render
      setTimeout(loadWidgets, 200)
    }
  }, [loading, embeds])

  // Reload twitter widgets when page changes
  useEffect(() => {
    if (loading || embeds.length === 0) return
    setTimeout(() => {
      if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(containerRef.current)
      }
    }, 200)
  }, [currentPage, loading, embeds])

  const activeEmbed = embeds.find(e => e.isActive)
  const pastEmbeds = embeds.filter(e => !e.isActive)
  const totalPages = Math.ceil(pastEmbeds.length / ITEMS_PER_PAGE)
  const paginatedEmbeds = pastEmbeds.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {activeEmbed && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                LIVE
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">Live on X</h1>
          <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto sm:text-base">
            Follow latest X Spaces, discussing developments on the Constitution.
          </p>
          <a
            href="https://x.com/DiasporaVote"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow @DiasporaVote
          </a>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 sm:py-16">
        <div ref={containerRef} className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="h-8 w-8 animate-spin text-slate-400 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-slate-500">Loading posts…</p>
            </div>
          ) : embeds.length === 0 ? (
            <div className="text-center py-20">
              <svg className="mx-auto h-16 w-16 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No posts yet</h2>
              <p className="mt-1 text-sm text-slate-500">Check back soon for our latest Twitter Spaces and updates.</p>
            </div>
          ) : (
            <>
              {/* Currently Live */}
              {activeEmbed && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">Currently Live</h2>
                  </div>
                  <div className="mx-auto max-w-xl">
                    <div className="rounded-2xl border border-red-100 bg-red-50/30 p-4 sm:p-6">
                      <blockquote className="twitter-tweet" data-media-max-width="560">
                        <a href={activeEmbed.tweetUrl}>Loading…</a>
                      </blockquote>
                      {activeEmbed.label && (
                        <p className="mt-2 text-xs text-slate-500 text-center">{activeEmbed.label}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Past posts */}
              {pastEmbeds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {activeEmbed ? 'Previous Posts' : 'All Posts'}
                    </h2>
                    <span className="text-sm text-slate-500">{pastEmbeds.length} post{pastEmbeds.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedEmbeds.map((embed) => (
                      <div
                        key={embed.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <blockquote className="twitter-tweet" data-media-max-width="560">
                          <a href={embed.tweetUrl}>Loading…</a>
                        </blockquote>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                          {embed.label && <span>{embed.label}</span>}
                          <span className="ml-auto">{formatDate(embed.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-slate-900 text-white'
                              : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}
