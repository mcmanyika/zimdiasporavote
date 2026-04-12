'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createNewsletterSubscription } from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import Chatbot from '../Chatbot'

const WHATSAPP_URL = 'https://whatsapp.com/channel/0029VbCeX3FATRSwXmceVg3z'
const FACEBOOK_URL = 'https://www.facebook.com/share/1C4G3L4eka/'
const X_URL = 'https://x.com/DiasporaVote'

function ZimbabweSilhouette() {
  return (
    <svg
      viewBox="0 0 120 140"
      className="h-28 w-auto text-emerald-600/90 sm:h-36"
      aria-hidden
      fill="currentColor"
    >
      <path d="M60 8 L95 22 L108 55 L100 95 L72 128 L38 115 L18 78 L22 38 Z" opacity="0.85" />
    </svg>
  )
}

function IconSpeaker({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
      />
    </svg>
  )
}

function IconLightBulb({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V5.25a3 3 0 116 0v7.5a3 3 0 01-3 3z"
      />
    </svg>
  )
}

function IconBuilding({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 13.125v-3.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-3.75a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 21v-8.25M19.875 21v-8.25M21 12.75c0-.621-.504-1.125-1.125-1.125h-3.75c-.621 0-1.125.504-1.125 1.125v3.75c0 .621.504 1.125 1.125 1.125h3.75c.621 0 1.125-.504 1.125-1.125v-3.75z"
      />
    </svg>
  )
}

function IconWhatsApp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function IconMinusBold({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.25} aria-hidden>
      <path strokeLinecap="round" d="M18 12H6" />
    </svg>
  )
}

const HERO_BG = "url('/images/hero_section.png')"
const CLOUDS_BG = "url('/images/clouds.png')"
const PARALLAX_STRENGTH = 0.12

export default function DiasporaVoteLanding() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  const cloudsRef = useRef<HTMLElement>(null)
  const [heroParallaxY, setHeroParallaxY] = useState(0)
  const [cloudsParallaxY, setCloudsParallaxY] = useState(0)
  const reduceMotionRef = useRef(false)

  useEffect(() => {
    reduceMotionRef.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const update = () => {
      if (reduceMotionRef.current) {
        setHeroParallaxY(0)
        setCloudsParallaxY(0)
        return
      }
      const hero = heroRef.current
      if (hero) {
        const rect = hero.getBoundingClientRect()
        setHeroParallaxY(rect.top * PARALLAX_STRENGTH)
      }
      const clouds = cloudsRef.current
      if (clouds) {
        const rect = clouds.getBoundingClientRect()
        setCloudsParallaxY(rect.top * PARALLAX_STRENGTH)
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const nav = [
    { label: 'About', href: '#about' },
    { label: 'The Problem', href: '#problem' },
    { label: 'Get Involved', href: '#get-involved' },
    { label: 'Updates', href: '/news' },
  ]

  async function onJoinNewsletter(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setMsg({ type: 'err', text: 'Please enter your email address.' })
      return
    }
    setLoading(true)
    try {
      await createNewsletterSubscription({
        email: trimmed,
        ...(user?.uid ? { userId: user.uid } : {}),
      })
      setMsg({ type: 'ok', text: "You're on the list. Thank you!" })
      setEmail('')
    } catch {
      setMsg({ type: 'err', text: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/logo.png"
              alt="DiasporaVote"
              width={220}
              height={64}
              className="h-9 w-auto object-contain object-left sm:h-10"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) =>
              item.href.startsWith('#') ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-dv-navy/90 transition-colors hover:text-blue-600"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-dv-navy/90 transition-colors hover:text-blue-600"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/membership-application"
              className="hidden rounded-full bg-dv-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dv-red-hover sm:inline-flex"
            >
              Join the Movement
            </Link>
            <button
              type="button"
              className="inline-flex rounded-lg p-2 text-dv-navy md:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              {nav.map((item) =>
                item.href.startsWith('#') ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-base font-medium text-dv-navy"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base font-medium text-dv-navy"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <Link
                href="/membership-application"
                className="mt-2 inline-flex justify-center rounded-full bg-dv-red py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                Join the Movement
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section
        ref={heroRef}
        className="relative flex min-h-[min(100vh,720px)] items-center overflow-hidden py-14 sm:min-h-[560px] sm:py-20"
      >
        {/* Taller layer + translate3d parallax (avoids gaps when image shifts) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-0 right-0 bg-cover bg-center bg-no-repeat will-change-transform"
            style={{
              top: '-12%',
              height: '124%',
              backgroundImage: HERO_BG,
              transform: `translate3d(0, ${heroParallaxY}px, 0)`,
            }}
          />
        </div>
        {/* Light scrim on the left keeps headline & CTAs readable over the artwork */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/90 via-white/55 to-transparent sm:from-white/85 sm:via-white/35"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-dv-navy sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Let Zimbabweans Abroad Have Their Voice
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600 sm:text-xl">
              Join the movement for diaspora voting rights! Your voice matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/membership-application"
                className="inline-flex items-center justify-center rounded-full bg-dv-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-dv-navy/90"
              >
                Join the Movement
              </Link>
              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-full border-2 border-dv-navy bg-white/95 px-6 py-3 text-sm font-semibold text-dv-navy backdrop-blur-sm transition-colors hover:bg-white"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 border-t border-slate-100 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-dv-navy sm:text-3xl">About DiasporaVote Initiative</h2>
          <p className="mt-3 max-w-3xl text-slate-600 sm:text-lg">
            We are committed to fair representation for every Zimbabwean—at home and across the diaspora—through
            peaceful advocacy and democratic participation.
          </p>
          <div className="mt-10 max-w-3xl">
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-dv-navy">Who We Are</h3>
                  <p className="mt-1 text-slate-600">A civic initiative advocating for diaspora voting rights.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-dv-navy">Our Mission</h3>
                  <p className="mt-1 text-slate-600">
                    To empower Zimbabweans abroad with the right to participate in their home country&apos;s democratic
                    process.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-dv-navy">Our Belief</h3>
                  <p className="mt-1 text-slate-600">
                    Every Zimbabwean&apos;s voice should count, no matter where they live.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="problem"
        className="scroll-mt-24 bg-gradient-to-b from-dv-sky-deep/80 to-dv-sky py-14 sm:py-20"
      >
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="pointer-events-none absolute right-4 top-8 opacity-40 sm:right-10 lg:right-16">
            <ZimbabweSilhouette />
          </div>
          <h2 className="relative max-w-3xl text-2xl font-bold text-dv-navy sm:text-3xl">
            The Problem: No Voting Rights for Zimbabweans Abroad
          </h2>
          <ul className="relative mt-8 max-w-2xl space-y-5">
            {[
              'Millions of Zimbabweans live abroad but cannot vote',
              'Lack of voting rights violates democratic principles',
              "The diaspora community's voice remains unheard",
            ].map((line) => (
              <li key={line} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dv-red text-white">
                  <IconMinusBold className="h-4 w-4" />
                </span>
                <span className="text-lg text-dv-navy/90">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        ref={cloudsRef}
        id="get-involved"
        className="relative scroll-mt-24 overflow-hidden border-t border-slate-200/80 py-14 sm:py-20"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-0 right-0 bg-cover bg-center bg-no-repeat will-change-transform"
            style={{
              top: '-12%',
              height: '124%',
              backgroundImage: CLOUDS_BG,
              transform: `translate3d(0, ${cloudsParallaxY}px, 0)`,
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-sky-50/20 to-white/35" aria-hidden />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 sm:gap-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-dv-navy sm:text-3xl">The Solution: DiasporaVote&apos;s Campaign</h2>
            <ul className="mt-8 space-y-8">
              <li className="flex gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800"
                  aria-hidden
                >
                  <IconSpeaker className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-dv-navy">Advocacy</h3>
                  <p className="mt-1 text-slate-600">Working to change policies and laws.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"
                  aria-hidden
                >
                  <IconLightBulb className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-dv-navy">Awareness</h3>
                  <p className="mt-1 text-slate-600">Informing and mobilizing the diaspora community.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-700"
                  aria-hidden
                >
                  <IconBuilding className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-dv-navy">Policy Engagement</h3>
                  <p className="mt-1 text-slate-600">Engaging with Zimbabwean lawmakers and policymakers.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-dv-sky/50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-dv-navy sm:text-2xl">Get Involved: join the Movement</h2>
            <form onSubmit={onJoinNewsletter} className="mt-6">
              <label htmlFor="dv-email" className="sr-only">
                Email address
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="dv-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[48px] flex-1 rounded-l-xl rounded-r-xl border border-slate-300 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:rounded-r-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-[48px] shrink-0 rounded-l-xl rounded-r-xl bg-dv-red px-5 text-sm font-semibold text-white transition-colors hover:bg-dv-red-hover disabled:opacity-60 sm:rounded-l-none sm:rounded-r-xl"
                >
                  {loading ? '…' : 'Join the Movement'}
                </button>
              </div>
              {msg && (
                <p className={`mt-3 text-sm ${msg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>
              )}
            </form>

            <div className="mt-8 text-sm">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-dv-navy underline decoration-blue-300 underline-offset-4 hover:text-blue-700"
              >
                <IconWhatsApp className="h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
                WhatsApp Group
              </a>
            </div>

            <p className="mt-8 text-sm font-medium text-dv-navy">Follow us for the latest updates!</p>
            <div className="mt-3 flex gap-4">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1877F2] transition-opacity hover:opacity-80"
                aria-label="Facebook"
              >
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dv-navy transition-opacity hover:opacity-80"
                aria-label="X (Twitter)"
              >
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-dv-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="inline-flex shrink-0 items-center rounded-md bg-white/10 p-2 ring-1 ring-white/15">
            <Image
              src="/images/logo.png"
              alt="DiasporaVote"
              width={220}
              height={64}
              className="h-8 w-auto max-w-[200px] object-contain object-left sm:h-9"
            />
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100/90">
            <a href="#about" className="hover:text-white">
              About
            </a>
            <a href="#get-involved" className="hover:text-white">
              Get involved
            </a>
            <Link href="/news" className="hover:text-white">
              Updates
            </Link>
            <a href="mailto:contact@diasporavote.org" className="hover:text-white">
              Contact
            </a>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
          </nav>
          <div className="flex gap-4">
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white" aria-label="Facebook">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white" aria-label="X">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-blue-200/60">
          © {new Date().getFullYear()} DiasporaVote Initiative. All rights reserved.
        </div>
      </footer>

      <Chatbot hideWhatsApp />
    </main>
  )
}
