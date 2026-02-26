'use client'

import { useEffect, useMemo, useState } from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import { getVideos } from '@/lib/firebase/firestore'
import type { Video } from '@/types'

function categoryLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true)
        const data = await getVideos(true)
        setVideos(data)
      } catch (err) {
        console.error('Error loading videos:', err)
      } finally {
        setLoading(false)
      }
    }
    loadVideos()
  }, [])

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(videos.map((video) => video.category).filter(Boolean)))]
  }, [videos])

  const filtered = useMemo(() => {
    return videos.filter((video) => {
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = !query ||
        video.title.toLowerCase().includes(query) ||
        (video.description || '').toLowerCase().includes(query) ||
        (video.tags || []).some((tag) => tag.toLowerCase().includes(query))
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [videos, searchQuery, selectedCategory])

  const featured = filtered.find((video) => video.isFeatured) || filtered[0]
  const gridVideos = featured ? filtered.filter((video) => video.id !== featured.id) : filtered

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pb-10 pt-24 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Learning Library</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Educational Videos</h1>
            <p className="mx-auto max-w-3xl text-sm text-slate-300 sm:text-base">
              Watch civic education videos on constitutional rights, democratic accountability, and active citizen participation.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : categoryLabel(cat)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                <p className="text-slate-500">Loading videos...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
              <div className="mb-3 text-5xl">🎬</div>
              <h2 className="text-xl font-bold text-slate-900">No Videos Found</h2>
              <p className="mt-2 text-sm text-slate-500">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {featured && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-2">
                    <div className="aspect-video bg-black">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${featured.youtubeVideoId}`}
                        title={featured.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex flex-col justify-between p-5 sm:p-6">
                      <div>
                        <p className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          Featured · {categoryLabel(featured.category)}
                        </p>
                        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{featured.title}</h2>
                        {featured.description && (
                          <p className="mt-3 text-sm text-slate-600">{featured.description}</p>
                        )}
                        {!!featured.tags?.length && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {featured.tags.slice(0, 6).map((tag) => (
                              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        {featured.durationLabel && (
                          <span className="text-xs font-medium text-slate-500">{featured.durationLabel}</span>
                        )}
                        <a
                          href={featured.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                        >
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {gridVideos.length > 0 && (
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {gridVideos.map((video) => (
                    <article key={video.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="aspect-video bg-slate-100">
                        <iframe
                          className="h-full w-full"
                          src={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
                          title={video.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            {categoryLabel(video.category)}
                          </span>
                          {video.durationLabel && <span className="text-[11px] text-slate-500">{video.durationLabel}</span>}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 sm:text-base">{video.title}</h3>
                        {video.description && (
                          <p className="mt-2 line-clamp-3 text-xs text-slate-600">{video.description}</p>
                        )}
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Open on YouTube
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}
