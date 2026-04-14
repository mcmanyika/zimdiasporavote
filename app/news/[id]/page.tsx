'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Newspaper } from 'lucide-react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { getNewsById, trackArticleView, getArticleViewCount } from '@/lib/firebase/firestore'
import type { News } from '@/types'
import Link from 'next/link'

export default function NewsDetailPage() {
  const params = useParams()
  const [news, setNews] = useState<News | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [viewCount, setViewCount] = useState(0)

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true)
        const id = params.id as string
        const newsItem = await getNewsById(id)
        
        if (!newsItem) {
          setError('Article not found')
          return
        }
        
        // Only show published articles to public
        if (!newsItem.isPublished) {
          setError('This article is not available')
          return
        }
        
        setNews(newsItem)

        // Track view and get count
        trackArticleView(id, newsItem.title)
        getArticleViewCount(id).then(setViewCount)
      } catch (err: any) {
        console.error('Error loading news:', err)
        setError(err.message || 'Failed to load article')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadNews()
    }
  }, [params.id])

  const formatDate = (date: any) => {
    if (!date) return ''
    const d = date instanceof Date ? date : date?.toDate?.() || new Date(date)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <Header />

      {/* Back Link */}
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-dv-sky/40 to-white pt-20">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link
            href="/news"
            className="inline-flex items-center text-sm font-medium text-dv-navy/90 transition-colors hover:text-blue-600"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Articles
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-dv-navy border-r-transparent" />
              <p className="text-slate-600">Loading article...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate-200/90 bg-dv-sky/30 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-500 shadow-sm">
              <Newspaper className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-dv-navy">Article Not Found</h1>
            <p className="mb-6 text-slate-600">{error}</p>
            <Link
              href="/news"
              className="inline-flex items-center rounded-full bg-dv-red px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dv-red-hover"
            >
              View all articles
            </Link>
          </div>
        ) : news ? (
          <article>
            {/* Category Badge */}
            {news.category && (
              <span className="mb-4 inline-block rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-dv-navy/85 shadow-sm">
                {news.category}
              </span>
            )}

            {/* Title */}
            <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-dv-navy sm:text-4xl md:text-5xl">
              {news.title}
            </h1>

            {/* Meta & Share Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500 mb-8 pb-6 border-b">
              <div className="flex flex-wrap items-center gap-3">
                {news.author && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-dv-navy text-xs font-bold text-white">
                      {news.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">{news.author}</span>
                      <span className="block text-xs text-slate-400">{formatDate(news.publishedAt || news.createdAt)}</span>
                    </div>
                  </div>
                )}
                {!news.author && <span>{formatDate(news.publishedAt || news.createdAt)}</span>}
                {viewCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.href
                    const text = `${news.title}`
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
                  }}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-dv-sky/60 hover:text-dv-navy"
                  title="Share on X"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.href
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                  }}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-dv-sky/60 hover:text-dv-navy"
                  title="Share on Facebook"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.href
                    const text = `${news.title} - ${url}`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-dv-sky/60 hover:text-dv-navy"
                  title="Share on WhatsApp"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-dv-sky/60 hover:text-dv-navy"
                  title="Copy link"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image + Description Side-by-Side */}
            <div className={`mb-10 ${news.image ? 'grid grid-cols-1 md:grid-cols-5 gap-6' : ''}`}>
              {/* Featured Image */}
              {news.image && (
                <div
                  className="group h-fit cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200/80 shadow-md md:col-span-2"
                  onClick={() => setShowImageModal(true)}
                >
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-56 md:h-64 object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Description / Lead Text */}
              <div className={`flex flex-col justify-between ${news.image ? 'md:col-span-3' : 'max-w-3xl'}`}>
                <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium">
                  {news.description}
                </p>
                {/* Quick info sidebar */}
                <div className="mt-4 border-l-4 border-dv-navy/80 py-2 pl-4">
                  <p className="text-sm text-slate-500 italic leading-relaxed">
                    Published by <span className="font-semibold text-slate-700">{news.author || 'DV'}</span> on {formatDate(news.publishedAt || news.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200 mb-10" />

            {/* Full Content */}
            {news.content && (
              <div>
                <div 
                  className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-dv-navy prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-700 prose-a:underline prose-img:rounded-xl prose-img:shadow-md prose-blockquote:border-l-dv-navy prose-blockquote:text-slate-600"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              </div>
            )}

            {/* Bottom Share CTA */}
            <div className="mt-14 border-t border-slate-200/80 pt-8">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-dv-navy">Enjoyed this article?</h3>
                  <p className="text-sm text-slate-600">Share it with your network</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.location.href
                      const text = `${news.title} - ${url}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-dv-navy shadow-sm transition-colors hover:bg-dv-sky/50"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.location.href
                      const text = `${news.title}`
                      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-dv-navy shadow-sm transition-colors hover:bg-dv-sky/50"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.location.href
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-dv-navy shadow-sm transition-colors hover:bg-dv-sky/50"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Link copied to clipboard!')
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-dv-navy shadow-sm transition-colors hover:bg-dv-sky/50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                    </svg>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </article>
        ) : null}
      </div>

      {/* Image Lightbox Modal */}
      {showImageModal && news?.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowImageModal(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative max-w-4xl w-full max-h-[85vh] animate-[fadeInScale_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            {/* Caption bar */}
            {news.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg px-4 py-3">
                <p className="text-white text-sm font-medium">{news.title}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Section */}

      {/* Footer */}
      <Footer />
    </main>
  )
}

