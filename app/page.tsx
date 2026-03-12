'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react';
import Link from 'next/link';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ContactForm from './components/ContactForm';
import DonationModal from './components/DonationModal';
import Chatbot from './components/Chatbot';
import TwitterEmbed from './components/TwitterEmbed';
import { createNewsletterSubscription, getProducts, getProductById, getGalleryImages, getOrganizations, trackDownload, getDownloadCount } from '@/lib/firebase/firestore';
import type { Product, GalleryImage, Organization } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

const fallbackOrganizations = [
  'Transform Zimbabwe',
  'CCC Progressive',
  'National Democratic Working Group',
  'International Socialist Organisation',
  'Zimbabwe National Students Union',
  'ARTUZ',
  'SAPES Trust',
  'ZCTU',
  'Mine Workers Union of Zimbabwe'
]

const affiliateLinks: Record<string, string> = {
  'SAPES Trust': 'https://sapes.org.zw/',
}

export default function Home() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()
  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productStartIndex, setProductStartIndex] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
  const [newsletterError, setNewsletterError] = useState('')
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [billDownloadCount, setBillDownloadCount] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)
  const [affiliateJoinModalOpen, setAffiliateJoinModalOpen] = useState(false)
  const [donationPrefillMessage, setDonationPrefillMessage] = useState('')

  // Declaration cards scroll-in animation
  const declarationCardsRef = useRef<HTMLDivElement>(null)
  const [cardsVisible, setCardsVisible] = useState(false)

  useEffect(() => {
    const el = declarationCardsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCardsVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Handle hash navigation to open modal
    const handleHashChange = () => {
      if (window.location.hash === '#donate') {
        setDonationModalOpen(true)
        // Remove hash from URL without scrolling
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    // Check on mount
    if (window.location.hash === '#donate') {
      setDonationModalOpen(true)
      window.history.replaceState(null, '', window.location.pathname)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])


  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true)
        const activeProducts = await getProducts(true) // Get only active products
        setProducts(activeProducts)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setProductsLoading(false)
      }
    }
    loadProducts()
  }, [])

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setGalleryLoading(true)
        const images = await getGalleryImages(true) // published only
        const latestFirst = [...images].sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime()
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime()
          return bTime - aTime
        })
        setGalleryImages(latestFirst.slice(0, 10)) // Show latest 10 uploads
      } catch (error) {
        console.error('Error loading gallery:', error)
      } finally {
        setGalleryLoading(false)
      }
    }
    loadGallery()
  }, [])

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await getOrganizations(true)
        setOrganizations(orgs)
      } catch (error) {
        console.error('Error loading organizations:', error)
      }
    }
    loadOrganizations()
  }, [])

  // Responsive products per view: 1 on mobile, 2 on tablet, 4 on desktop
  const [productsPerView, setProductsPerView] = useState(4)

  useEffect(() => {
    const updatePerView = () => {
      const width = window.innerWidth
      if (width < 640) setProductsPerView(1)
      else if (width < 1024) setProductsPerView(2)
      else setProductsPerView(4)
    }
    updatePerView()
    window.addEventListener('resize', updatePerView)
    return () => window.removeEventListener('resize', updatePerView)
  }, [])

  // Reset start index when productsPerView changes to avoid blank slides
  useEffect(() => {
    setProductStartIndex(0)
  }, [productsPerView])

  useEffect(() => {
    getDownloadCount('amendment-bill-no3').then(setBillDownloadCount)
  }, [])

  const handleBillDownload = async () => {
    try {
      await trackDownload('amendment-bill-no3', 'Constitution of Zimbabwe Amendment (No. 3) Bill, 2026')
      setBillDownloadCount((prev) => prev + 1)
    } catch (err) {
      console.error('Error tracking download:', err)
    }
  }

  const openDonationModal = (prefillMessage = '') => {
    setDonationPrefillMessage(prefillMessage)
    setDonationModalOpen(true)
  }

  const closeDonationModal = () => {
    setDonationModalOpen(false)
    setDonationPrefillMessage('')
  }

  const visibleProducts = products.slice(productStartIndex, productStartIndex + productsPerView)
  const canGoLeft = productStartIndex > 0
  const canGoRight = productStartIndex + productsPerView < products.length

  const handlePrevious = () => {
    setProductStartIndex((prev) => Math.max(0, prev - productsPerView))
  }

  const handleNext = () => {
    setProductStartIndex((prev) => Math.min(products.length - productsPerView, prev + productsPerView))
  }

  const handlePurchase = async (product: Product) => {
    setError('')

    // Check if user is authenticated
    if (!user) {
      // Redirect to login page with return URL to shop
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`)
      return
    }

    // Check stock availability
    if (product.stock <= 0) {
      setError('This product is out of stock')
      return
    }

    // Refresh product to get latest stock
    try {
      const latestProduct = await getProductById(product.id)
      if (!latestProduct || latestProduct.stock <= 0) {
        setError('This product is out of stock')
        return
      }
    } catch (err) {
      console.error('Error checking stock:', err)
    }

    setLoading(product.id)

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: product.price,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          userName: user?.displayName || null,
          type: 'purchase',
          description: `Purchase: ${product.name}`,
          productId: product.id,
          productName: product.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      // Redirect to payment page with client secret and product ID
      router.push(`/payment?client_secret=${data.clientSecret}&product=${encodeURIComponent(product.name)}&productId=${product.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to process purchase')
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header onDonateClick={() => openDonationModal()} onContactClick={() => setContactOpen(true)} startAtBottom />

      <div className="hidden md:block">
        <HeroSection />
      </div>

      {/* All content below hero - sits above hero with z-index */}
      <div className="relative z-10 pt-20 md:pt-0">

        {/* Countdown Section */}
        <CountdownBanner />

        {/* National Referendum Declaration */}
        <section id="updates" className="bg-white py-16 sm:py-20 border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
              <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
                <div className="p-6 text-center sm:p-8 md:p-10 md:text-left">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 md:text-left">
                    National Referendum Declaration
                  </p>
                  <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base md:mx-0">
                    Zimbabwe stands at a defining constitutional moment. A proposed constitutional amendment seeks to extend presidential and parliamentary tenure without direct approval by the citizens of Zimbabwe.
                  </p>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base md:mx-0">
                    This is not a minor procedural reform. It alters the sovereign right of the people to choose their leaders at regular constitutional intervals. The Constitution of Zimbabwe (2013) was adopted by referendum. Any change affecting the people&apos;s right to elect and replace leadership must therefore return to the people.
                  </p>

                  <div className="mt-7 flex justify-center md:justify-start">
                    <Link
                      href="/petitions"
                      className="group inline-flex items-center gap-2.5 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>Sign Petition</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 md:border-l md:border-t-0 md:p-6">
                  <div className="mx-auto max-w-[270px]">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img
                        src="/downloads/courtCase.jpeg"
                        alt="Court case filing document"
                        className="h-auto w-full object-cover"
                      />
                    </div>
                    <a
                      href="/downloads/courtCase.jpeg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      View Full Filing
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Civic Engagement Stripe */}
        <section className="bg-gradient-to-r from-emerald-900 to-slate-900 py-8 sm:py-10">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <div className="mb-3 flex justify-center">
              <svg className="h-10 w-10 text-emerald-300 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">Download the Proposed Amendment Bill No. 3</h2>
            <p className="text-sm text-emerald-200/80 sm:text-base">
              Read the full PDF version of the Constitution of Zimbabwe Amendment (No. 3) Bill, 2026.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <a
                href="https://firebasestorage.googleapis.com/v0/b/defend-constitution-plat-dba4c.firebasestorage.app/o/resources%2F1771394376305-H.B.%201%2C%202026%20Constitution%20of%20Zimbabwe%20Amendment%20(No.%203)%202026.pdf?alt=media&token=7ba8167f-39ae-4e06-b2d2-b957dca04042"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleBillDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
              <Link
                href="/petitions"
                className="inline-flex w-full items-center justify-center rounded-md border-2 border-white px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
              >
                Sign a Petition
              </Link>
            </div>
            {billDownloadCount > 0 && (
              <p className="mt-4 text-xs text-emerald-300/70">
                <span className="font-semibold text-emerald-200">{billDownloadCount.toLocaleString()}</span> {billDownloadCount === 1 ? 'download' : 'downloads'}
              </p>
            )}
          </div>
        </section>

        {/* Donate Appeal */}
        <section id="donate-section" className="bg-slate-50 py-10 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200">
              <div className="grid md:grid-cols-2">
                {/* Left – Message */}
                <div className="flex flex-col justify-center p-6 sm:p-10">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Support the Cause</p>
                  <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Donations help efforts to pushback on Agenda 2030
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    No amount is too small — together we can protect Zimbabwe&apos;s democratic future.
                  </p>
                  <ul className="mb-6 space-y-2">
                    {[
                      'Fund civic education & awareness campaigns',
                      'Support legal challenges to unconstitutional actions',
                      'Enable grassroots community mobilisation',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      onClick={() => openDonationModal()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:w-auto"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Donate Now
                    </button>
                    <Link
                      href="/membership-application"
                      className="inline-flex w-full items-center justify-center rounded-lg border-2 border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white sm:w-auto"
                    >
                      Become a Member
                    </Link>
                  </div>
                </div>
                {/* Right – Visual */}
                <div className="relative hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
                  <div className="relative flex h-full flex-col items-center justify-center p-10 text-center text-slate-800">
                    <svg className="mb-4 h-16 w-16 text-emerald-600 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-3xl font-extrabold sm:text-4xl">100%</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">of donations go directly<br />to defending our Constitution</p>
                    <div className="mt-6 flex items-center gap-4 text-xs text-slate-400">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-700">Secure</p>
                        <p>Stripe payments</p>
                      </div>
                      <div className="h-8 w-px bg-slate-300" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-700">Transparent</p>
                        <p>Track your impact</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta-section" className="bg-gradient-to-r from-slate-900 to-slate-800 py-8 text-white sm:py-12">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">Ready to Make a Difference?</h2>
            <p className="mb-6 text-sm text-slate-300 sm:text-base">
              Join thousands of citizens working together to oppose the 2030 agenda, defend the Constitution, and protect our democratic values.
            </p>
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
              >
                Join the Platform
              </Link>
              <button
                onClick={() => openDonationModal()}
                className="inline-flex w-full items-center justify-center rounded-md border-2 border-white px-5 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
              >
                Support Our Work
              </button>
            </div>
          </div>
        </section>

        {/* Sponsored Merchandise Section */}
        <section id="sponsored-merchandise" className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              <div className="grid items-stretch md:grid-cols-2">
                <div className="relative min-h-[280px] bg-slate-100">
                  <img
                    src="/images/store/pack.png"
                    alt="Sponsored merchandise pack ready for delivery"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Sponsored Merchandise
                  </p>
                  <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Buy item for Someone
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                    You can  sponsor DCP merchandise for others and help us spread the message.
                  </p>
                  <ul className="mb-6 space-y-2 text-sm text-slate-700">
                    {[
                      'Choose a merchandise pack and complete checkout',
                      'We direct sponsored packs to identified recipients',
                      'Your purchase strengthens outreach in underserved areas',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      onClick={() => openDonationModal('Sponsered merchandise')}
                      className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
                    >
                      Sponser Item
                    </button>
                    <Link
                      href="/shop"
                      className="inline-flex w-full items-center justify-center rounded-md border-2 border-slate-900 px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 sm:w-auto"
                    >
                      Browse Merchandise
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shop Products Section */}
        <section id="shop-section" className="hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-slate-900 border-r-transparent"></div>
                  <p className="text-sm text-slate-500">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No products available at the moment.</p>
              </div>
            ) : (
              <div className="relative overflow-hidden">
                {canGoLeft && (
                  <button
                    onClick={handlePrevious}
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-4 rounded-full bg-white p-2 shadow-lg hover:bg-slate-50 transition-colors border border-slate-200"
                    aria-label="Previous products"
                  >
                    <svg className="h-5 w-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {canGoRight && (
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 rounded-full bg-white p-2 shadow-lg hover:bg-slate-50 transition-colors border border-slate-200"
                    aria-label="Next products"
                  >
                    <svg className="h-5 w-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-3 transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(calc(-${productStartIndex} * ((100% + ${(productsPerView - 1) * 0.75}rem) / ${productsPerView})))`,
                    }}
                  >
                    {products.map((product) => {
                      const isOutOfStock = product.stock === 0
                      const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold

                      return (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="group rounded-lg border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-900 hover:shadow-md flex-shrink-0 cursor-pointer"
                          style={{ width: `calc((100% - ${(productsPerView - 1) * 0.75}rem) / ${productsPerView})` }}
                        >
                          <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isLowStock && !isOutOfStock && (
                              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                                {product.stock} left
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-bold line-clamp-1 text-center">{product.name}</h3>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-8 text-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center rounded-md border-2 border-slate-900 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  View All Products
                </Link>
              </div>
            )}
          </div>

          {/* Product Detail Modal */}
          {selectedProduct && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedProduct(null)}
            >
              <div
                className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 hover:bg-white transition-colors shadow-lg"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="grid md:grid-cols-2 gap-0">
                  {/* Product Image */}
                  <div className="relative bg-slate-100 aspect-square md:aspect-auto md:min-h-[500px]">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-full w-full object-cover"
                    />
                    {selectedProduct.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-6 sm:p-8 flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-4">{selectedProduct.name}</h2>

                      <div className="mb-6">
                        {selectedProduct.stock > 0 && selectedProduct.stock <= selectedProduct.lowStockThreshold && (
                          <p className="text-sm font-medium text-yellow-600 mb-2">
                            Only {selectedProduct.stock} left!
                          </p>
                        )}
                        <p className="text-4xl font-bold text-slate-900 mb-4">
                          ${selectedProduct.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Description
                        </h3>
                        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedProduct.description}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Stock Status
                        </h3>
                        <p className="text-base text-slate-700">
                          {selectedProduct.stock === 0
                            ? 'Out of Stock'
                            : selectedProduct.stock <= selectedProduct.lowStockThreshold
                              ? `Low Stock - ${selectedProduct.stock} available`
                              : `In Stock - ${selectedProduct.stock} available`}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto pt-6 border-t border-slate-200 space-y-3">
                      <button
                        onClick={() => {
                          addToCart(selectedProduct)
                          setSelectedProduct(null)
                        }}
                        disabled={selectedProduct.stock === 0}
                        className="w-full rounded-lg border-2 border-slate-900 bg-white px-6 py-4 text-base font-semibold text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {selectedProduct.stock === 0 ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(null)
                          handlePurchase(selectedProduct)
                        }}
                        disabled={loading === selectedProduct.id || selectedProduct.stock === 0}
                        className="w-full rounded-lg bg-slate-900 px-6 py-4 text-base font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === selectedProduct.id
                          ? 'Processing...'
                          : selectedProduct.stock === 0
                            ? 'Out of Stock'
                            : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Affiliated Organizations Section */}
        <section id="affiliates-section" className="bg-white py-10 sm:py-14 border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 text-center sm:mb-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Partnerships
              </p>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Organisations Affiliated to Us
              </h2>
              <div className="mt-4 flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-medium text-slate-500 sm:text-sm">
                  Join as an affiliate
                </span>
                <button
                  onClick={() => setAffiliateJoinModalOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-700 text-emerald-700 transition-colors hover:bg-emerald-700 hover:text-white"
                  aria-label="Request to join as an affiliate"
                  title="Request to join"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(organizations.length > 0
                ? organizations.map((org) => org.name === 'Amalgamation of Rural Teachers Union of Zimbabwe' ? 'ARTUZ' : org.name)
                : fallbackOrganizations
              ).map((org) => {
                const link = affiliateLinks[org]
                const cardClassName = "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"

                if (link) {
                  return (
                    <a
                      key={org}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${cardClassName} block hover:text-emerald-700`}
                    >
                      {org}
                    </a>
                  )
                }

                return (
                  <div
                    key={org}
                    className={cardClassName}
                  >
                    {org}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        {!galleryLoading && galleryImages.length > 0 && (
          <section id="gallery-section" className="bg-slate-900 pt-px">

            {/* Full-width image grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`relative aspect-square overflow-hidden cursor-pointer group ${index >= 4 ? 'hidden sm:block' : ''}`}
                  onClick={() => setGalleryLightbox(index)}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title || 'Gallery image'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex flex-col justify-between p-2">
                    {/* Share icons - top right */}
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent((image.title || 'Gallery image') + ' – Defend the Constitution Platform')}&url=${encodeURIComponent('https://dcpzim.com/gallery')}`, '_blank') }}
                        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                        title="Share on X"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://dcpzim.com/gallery')}`, '_blank') }}
                        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                        title="Share on Facebook"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((image.title || 'Gallery image') + ' – Defend the Constitution Platform')}%20${encodeURIComponent('https://dcpzim.com/gallery')}`, '_blank') }}
                        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.45 0-9.91 4.46-9.91 9.91 0 1.75.46 3.45 1.35 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.45 0 9.91-4.46 9.91-9.91S17.49 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c.01 4.54-3.68 8.23-8.22 8.23z" /></svg>
                      </button>
                    </div>
                    {/* Title - bottom */}
                    {image.title && (
                      <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">
                        {image.title}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>


            {/* Gallery Lightbox */}
            {galleryLightbox !== null && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={() => setGalleryLightbox(null)}
              >
                {/* Close */}
                <button
                  onClick={() => setGalleryLightbox(null)}
                  className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Previous */}
                {galleryLightbox > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setGalleryLightbox(galleryLightbox - 1) }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Next */}
                {galleryLightbox < galleryImages.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setGalleryLightbox(galleryLightbox + 1) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* Image */}
                <div
                  className="relative max-w-4xl w-full max-h-[85vh] animate-[fadeInScale_0.2s_ease-out]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={galleryImages[galleryLightbox].imageUrl}
                    alt={galleryImages[galleryLightbox].title || 'Gallery image'}
                    className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                  />
                  {galleryImages[galleryLightbox].title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg px-4 py-3">
                      <p className="text-white text-sm font-medium">{galleryImages[galleryLightbox].title}</p>
                      {galleryImages[galleryLightbox].categoryName && (
                        <p className="text-white/60 text-xs">{galleryImages[galleryLightbox].categoryName}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
                  {galleryLightbox + 1} / {galleryImages.length}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Affiliate Join Modal */}
        {affiliateJoinModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setAffiliateJoinModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-[fadeInScale_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setAffiliateJoinModalOpen(false)}
                className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Close affiliate join modal"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Affiliate Requests</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">Interested in Joining Our Affiliates?</h3>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                If your organisation wants to affiliate with us, please contact us and share your request to join.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setAffiliateJoinModalOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setAffiliateJoinModalOpen(false)
                    setContactOpen(true)
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {contactOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setContactOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setContactOpen(false) }}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-[fadeInScale_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setContactOpen(false)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="bg-slate-900 px-6 py-5">
                <h2 className="text-xl font-bold text-white">Contact Us</h2>
                <p className="text-sm text-slate-400 mt-1">We'd love to hear from you</p>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="mb-5 text-sm text-slate-600">
                  Have questions or want to get involved? Reach out to us through the form below.
                </p>
                <ContactForm />
              </div>

              {/* Footer */}
              <div className="border-t bg-slate-50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <a href="mailto:contact@dcpzim.com" className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    contact@dcpzim.com
                  </a>
                  <div className="flex items-center gap-3">
                    <a href="https://x.com/DCPlatform25" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a href="https://www.facebook.com/share/1C4G3L4eka/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a href="https://whatsapp.com/channel/0029VbCeX3FATRSwXmceVg3z" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#25D366] transition-colors">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <h3 className="mb-3 text-xs font-semibold">Get the App</h3>
                <p className="mb-3 text-xs text-slate-400">
                  Download our Android app for quick access.
                </p>
                <a
                  href="https://expo.dev/artifacts/eas/hopnYPS9wRJX8ugWGP9Uhz.apk"
                  download
                  className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.523 2.237a.625.625 0 0 0-.853.221l-1.09 1.837A7.628 7.628 0 0 0 12 3.5a7.628 7.628 0 0 0-3.58.795L7.33 2.458a.625.625 0 0 0-1.074.632l1.046 1.764A7.953 7.953 0 0 0 4 11h16a7.953 7.953 0 0 0-3.302-6.146l1.046-1.764a.625.625 0 0 0-.221-.853zM9 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 12v7a2 2 0 0 0 2 2h1v3a1.5 1.5 0 0 0 3 0v-3h4v3a1.5 1.5 0 0 0 3 0v-3h1a2 2 0 0 0 2-2v-7H4zm-2.5 0A1.5 1.5 0 0 0 0 13.5v5A1.5 1.5 0 0 0 3 18.5v-5A1.5 1.5 0 0 0 1.5 12zm21 0a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 3 0v-5a1.5 1.5 0 0 0-1.5-1.5z" />
                  </svg>
                  Download for Android
                </a>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold">Quick Links</h3>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                  <li><Link href="/our-work" className="hover:text-white transition-colors">Our Work</Link></li>
                  <li><Link href="/leadership" className="hover:text-white transition-colors">Leadership</Link></li>
                  <li><Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
                  <li><Link href="/surveys" className="hover:text-white transition-colors">Surveys</Link></li>
                  <li><Link href="/membership-application" className="hover:text-white transition-colors">Join DCP</Link></li>
                </ul>
              </div>

              <div>
                <div className="mb-3 h-4"></div>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
                  <li><Link href="/news" className="hover:text-white transition-colors">Articles</Link></li>
                  <li><Link href="/videos" className="hover:text-white transition-colors">Videos</Link></li>
                  <li><Link href="/twitter-live" className="hover:text-white transition-colors">Twitter Live</Link></li>
                  <li><button onClick={() => setContactOpen(true)} className="hover:text-white transition-colors">Contact</button></li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold">Follow Us</h3>
                <p className="mb-3 text-xs text-slate-400">
                  Connect with us on social media.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <a href="https://x.com/DCPlatform25" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="X (Twitter)">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a href="https://www.facebook.com/share/1C4G3L4eka/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors" aria-label="Facebook">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a href="https://youtube.com/@defendtheconstitutionplatform" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#FF0000] transition-colors" aria-label="YouTube">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                  <a href="https://www.tiktok.com/@defend.the.consti" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" aria-label="TikTok">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/dcplaform25" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-colors" aria-label="Instagram">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a href="https://whatsapp.com/channel/0029VbCeX3FATRSwXmceVg3z" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#25D366] transition-colors" aria-label="WhatsApp Channel">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 text-center text-[10px] text-slate-400 sm:text-xs">
              <p>© 2026 Defend the Constitution Platform. All rights reserved.</p>
              <p className="mt-1">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <span className="mx-1.5">·</span>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </p>
            </div>
          </div>
        </footer>
      </div>{/* End content wrapper */}

      {/* Donation Modal */}
      <DonationModal
        isOpen={donationModalOpen}
        onClose={closeDonationModal}
        initialMessage={donationPrefillMessage}
      />

      {/* Chatbot */}
      <Chatbot hideWhatsApp />

      {/* Floating Twitter/X Live Feed */}
      <TwitterEmbed hideAtSelectors={['#gallery-section', '#donate-section', '#cta-section']} />
    </main>
  );
}

function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Fixed target date: May 15, 2026 (87 days from Feb 17, 2026)
    const targetDate = new Date('2026-05-15T00:00:00')

    const calculate = () => {
      const now = new Date().getTime()
      const diff = targetDate.getTime() - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    calculate()
    const interval = setInterval(calculate, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  return (
    <section className="bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 py-6 sm:py-8">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-white/80 sm:text-base">
          {isExpired ? 'The Wait Is Over!' : 'Countdown'}
        </h2>
        <p className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
          {isExpired ? 'Our milestone has arrived.' : '90-Day Public Consultation'}
        </p>

        {!isExpired && (
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hours' },
              { value: timeLeft.minutes, label: 'Minutes' },
              { value: timeLeft.seconds, label: 'Seconds' },
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm sm:h-20 sm:w-20">
                  <span className="text-2xl font-extrabold tabular-nums text-white sm:text-4xl">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="animate-fade-in-scale text-center transition-all duration-300 hover:scale-105">
      <p className="mb-2 text-3xl font-bold text-slate-900 transition-colors duration-300 hover:text-slate-700 sm:text-4xl">{value}</p>
      <p className="text-xs text-slate-600 transition-colors duration-300 hover:text-slate-800 sm:text-sm">{label}</p>
    </div>
  );
}

function FocusCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="group animate-fade-in-scale rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:scale-105 hover:border-slate-900 hover:shadow-lg sm:p-6">
      <h3 className="mb-2 text-base font-bold transition-colors duration-300 group-hover:text-slate-900 sm:text-lg">{title}</h3>
      <p className="text-xs text-slate-600 transition-colors duration-300 group-hover:text-slate-700 sm:text-sm">{description}</p>
    </div>
  );
}
