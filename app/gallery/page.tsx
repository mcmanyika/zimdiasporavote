'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import { getGalleryCategories, getGalleryImages } from '@/lib/firebase/firestore'
import type { GalleryCategory, GalleryImage } from '@/types'
import { getSiteUrl } from '@/lib/branding'

const ITEMS_PER_PAGE = 12

const SITE_URL = `${getSiteUrl()}/gallery`

function ShareButtons({ title, size = 'sm' }: { imageUrl?: string; title: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false)
  const shareText = encodeURIComponent(`${title} – Diaspora Vote`)
  const shareUrl = encodeURIComponent(SITE_URL)

  const btnClass = size === 'sm'
    ? 'rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors'
    : 'rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors backdrop-blur-sm'
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className={`flex items-center ${size === 'sm' ? 'gap-1.5' : 'gap-2'}`} onClick={(e) => e.stopPropagation()}>
      {/* X (Twitter) */}
      <button
        onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, '_blank') }}
        className={btnClass}
        title="Share on X"
      >
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>
      {/* Facebook */}
      <button
        onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank') }}
        className={btnClass}
        title="Share on Facebook"
      >
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>
      {/* WhatsApp */}
      <button
        onClick={(e) => { e.stopPropagation(); window.open(`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`, '_blank') }}
        className={btnClass}
        title="Share on WhatsApp"
      >
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.45 0-9.91 4.46-9.91 9.91 0 1.75.46 3.45 1.35 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.45 0 9.91-4.46 9.91-9.91S17.49 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c.01 4.54-3.68 8.23-8.22 8.23z"/>
        </svg>
      </button>
      {/* Copy Link */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(SITE_URL)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className={btnClass}
        title={copied ? 'Copied!' : 'Copy image link'}
      >
        {copied ? (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function GalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [cats, imgs] = await Promise.all([
          getGalleryCategories(true),
          getGalleryImages(true),
        ])
        setCategories(cats)
        setImages(imgs)
      } catch (err) {
        console.error('Error fetching gallery data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.categoryId === selectedCategory)

  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE)
  const paginatedImages = filteredImages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePrevLightbox = useCallback(() => {
    if (!lightboxImage) return
    const idx = filteredImages.findIndex(i => i.id === lightboxImage.id)
    if (idx > 0) setLightboxImage(filteredImages[idx - 1])
  }, [lightboxImage, filteredImages])

  const handleNextLightbox = useCallback(() => {
    if (!lightboxImage) return
    const idx = filteredImages.findIndex(i => i.id === lightboxImage.id)
    if (idx < filteredImages.length - 1) setLightboxImage(filteredImages[idx + 1])
  }, [lightboxImage, filteredImages])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null)
      if (e.key === 'ArrowLeft') handlePrevLightbox()
      if (e.key === 'ArrowRight') handleNextLightbox()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxImage, handlePrevLightbox, handleNextLightbox])

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Our Gallery</p>
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">Photo Gallery</h1>
          <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto sm:text-base">
            Browse photos from our events, campaigns, and community activities.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="border-b bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                <p className="text-slate-600">Loading gallery...</p>
              </div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="py-20 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-slate-600">No images found in this category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
                {paginatedImages.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setLightboxImage(image)}
                    className="group cursor-pointer overflow-hidden rounded-lg bg-slate-100 aspect-square relative"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.title || 'Gallery image'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/placeholder.png'
                      }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col justify-between p-3">
                      {/* Share buttons (top-right) */}
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShareButtons imageUrl={image.imageUrl} title={image.title || image.categoryName || 'Gallery image'} size="sm" />
                      </div>
                      {/* Caption (bottom) */}
                      {(image.title || image.categoryName) && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {image.title && (
                            <p className="text-sm font-semibold text-white drop-shadow-lg">{image.title}</p>
                          )}
                          <p className="text-xs text-white/80 drop-shadow-lg">{image.categoryName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              <p className="mt-4 text-center text-xs text-slate-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredImages.length)} of {filteredImages.length} images
              </p>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous button */}
          {filteredImages.findIndex(i => i.id === lightboxImage.id) > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevLightbox() }}
              className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {filteredImages.findIndex(i => i.id === lightboxImage.id) < filteredImages.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNextLightbox() }}
              className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.title || 'Gallery image'}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
            {/* Caption & Share */}
            <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  {lightboxImage.title && (
                    <h3 className="text-lg font-semibold text-white">{lightboxImage.title}</h3>
                  )}
                  {lightboxImage.description && (
                    <p className="mt-1 text-sm text-white/80">{lightboxImage.description}</p>
                  )}
                  <p className="mt-1 text-xs text-white/60">{lightboxImage.categoryName}</p>
                </div>
                <ShareButtons imageUrl={lightboxImage.imageUrl} title={lightboxImage.title || 'Gallery image'} size="md" />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

