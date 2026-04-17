'use client'

import Link from 'next/link'
import { Crosshair, Mail, Newspaper, Settings, SquarePen, Star, Users, Volume2, UserPlus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createNewsletterSubscription, getLeaders, getNews } from '@/lib/firebase/firestore'
import type { Leader, News } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import Chatbot from '../Chatbot'
import DonationModal from '../DonationModal'
import Footer from '../Footer'
import Header from '../Header'
import { SITE_NAME } from '@/lib/branding'

const HERO_BG = "url('/images/hero_section.png')"
const DONATE_BG = "url('/images/team.png')"
const PARALLAX_STRENGTH = 0.12

const LANDING_NEWS_LIMIT = 3
const LANDING_LEADERS_LIMIT = 3
const LANDING_DONATION_AMOUNTS = [5, 10, 25, 50, 100]

function getStaggerDelay(index: number) {
  return `${Math.min(index, 4) * 90}ms`
}

function toNewsDate(date: Date | { toDate?: () => Date } | undefined) {
  if (!date) return undefined
  return date instanceof Date
    ? date
    : typeof (date as { toDate?: () => Date }).toDate === 'function'
      ? (date as { toDate: () => Date }).toDate()
      : new Date(date as string)
}

function formatNewsDate(date: Date | { toDate?: () => Date } | undefined) {
  const d = toNewsDate(date)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DiasporaVoteLanding() {
  const { user } = useAuth()
  const heroRef = useRef<HTMLElement>(null)
  const donateRef = useRef<HTMLElement>(null)
  const [heroParallaxY, setHeroParallaxY] = useState(0)
  const [donateParallaxY, setDonateParallaxY] = useState(0)
  const reduceMotionRef = useRef(false)
  const [newsItems, setNewsItems] = useState<News[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [leadersLoading, setLeadersLoading] = useState(true)
  const [newsletterBandEmail, setNewsletterBandEmail] = useState('')
  const [newsletterBandLoading, setNewsletterBandLoading] = useState(false)
  const [newsletterBandMsg, setNewsletterBandMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [donateModalOpen, setDonateModalOpen] = useState(false)
  const [selectedDonationAmount, setSelectedDonationAmount] = useState<number>(LANDING_DONATION_AMOUNTS[0])

  useEffect(() => {
    reduceMotionRef.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const update = () => {
      if (reduceMotionRef.current) {
        setHeroParallaxY(0)
        setDonateParallaxY(0)
        return
      }
      const hero = heroRef.current
      if (hero) {
        const rect = hero.getBoundingClientRect()
        setHeroParallaxY(rect.top * PARALLAX_STRENGTH)
      }
      const donate = donateRef.current
      if (donate) {
        const rect = donate.getBoundingClientRect()
        setDonateParallaxY(rect.top * PARALLAX_STRENGTH)
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

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setNewsLoading(true)
        const all = await getNews(true)
        if (!cancelled) {
          setNewsItems(all.slice(0, LANDING_NEWS_LIMIT))
        }
      } catch (e) {
        console.error('Error loading landing news:', e)
        if (!cancelled) setNewsItems([])
      } finally {
        if (!cancelled) setNewsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'))
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [newsItems.length, leaders.length])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLeadersLoading(true)
        const all = await getLeaders(true)
        if (!cancelled) {
          setLeaders(all.slice(0, LANDING_LEADERS_LIMIT))
        }
      } catch (e) {
        console.error('Error loading landing leadership:', e)
        if (!cancelled) setLeaders([])
      } finally {
        if (!cancelled) setLeadersLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function onNewsletterBandSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNewsletterBandMsg(null)
    const trimmed = newsletterBandEmail.trim()
    if (!trimmed) {
      setNewsletterBandMsg({ type: 'err', text: 'Please enter your email address.' })
      return
    }
    setNewsletterBandLoading(true)
    try {
      await createNewsletterSubscription({
        email: trimmed,
        ...(user?.uid ? { userId: user.uid } : {}),
      })
      setNewsletterBandMsg({ type: 'ok', text: "You're on the list. Thank you!" })
      setNewsletterBandEmail('')
    } catch {
      setNewsletterBandMsg({ type: 'err', text: 'Something went wrong. Please try again.' })
    } finally {
      setNewsletterBandLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased">
      <Header />

      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] items-center overflow-hidden py-14 sm:py-20"
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
          <div className="max-w-xl scroll-reveal" data-scroll-reveal style={{ transitionDelay: '90ms' }}>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-dv-navy sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Let Zimbabweans Abroad Have Their Voice
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600 sm:text-xl">
              Sign up to our newsletter for diaspora voting rights updates. Your voice matters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/membership-application"
                className="inline-flex items-center justify-center rounded-full bg-dv-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-dv-navy/90"
              >
                Apply for Membership
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

      <section id="about" className="scroll-mt-24 border-t border-slate-100 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center scroll-reveal" data-scroll-reveal>
            <h2 className="text-3xl font-extrabold text-slate-800 sm:text-5xl">What We Do</h2>
            <div className="mx-auto mt-4 flex w-full max-w-xs items-center justify-center gap-3">
              <span className="h-px flex-1 bg-slate-300" />
              <span className="text-slate-300" aria-hidden>
                *
              </span>
              <span className="h-px flex-1 bg-slate-300" />
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
              We lobby for Zimbabweans abroad to exercise their constitutional right to vote from their domiciled
              countries and to be included in governance issues affecting our country.
            </p>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Presidential Dialogue',
                copy: 'Engage the Office of the President to remind authorities of the 2018 commitment on the Diaspora Vote.',
                icon: Crosshair,
              },
              {
                title: 'Legislative Reform',
                copy: 'Appeal to Parliament to make legal changes that allow Zimbabweans abroad to vote from where they live.',
                icon: Volume2,
              },
              {
                title: 'Diaspora Awareness',
                copy: 'Build awareness among Zimbabweans outside the country about their constitutional voting rights and collective lobbying.',
                icon: Settings,
              },
              {
                title: 'National Awareness',
                copy: 'Raise awareness in Zimbabwe about how the absence of diaspora voting rights affects families and communities at home.',
                icon: UserPlus,
              },
              {
                title: 'Alliances & Advocacy',
                copy: 'Work with other diaspora-vote initiatives and appeal to regional and international bodies to encourage implementation.',
                icon: SquarePen,
              },
              {
                title: 'Mobilisation & Media',
                copy: 'Mobilise resources, engage supportive businesses, and use media platforms to sustain and amplify the diaspora vote message.',
                icon: Star,
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="scroll-reveal" data-scroll-reveal style={{ transitionDelay: getStaggerDelay(index) }}>
                  <div className="flex items-center gap-3">
                    <span className="text-dv-red" aria-hidden>
                      <Icon className="h-6 w-6" strokeWidth={2.1} />
                    </span>
                    <h3 className="text-xl font-semibold text-slate-800 sm:text-2xl">{item.title}</h3>
                  </div>
                  <div className="mt-3 h-px w-full bg-slate-200" aria-hidden />
                  <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">{item.copy}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="leadership"
        className="scroll-mt-24 border-t border-slate-100 bg-gradient-to-b from-dv-sky/25 via-white to-white py-14 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-2 text-center scroll-reveal" data-scroll-reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dv-navy/55">Our people</p>
              <h2 className="mt-1 text-2xl font-bold text-dv-navy sm:text-3xl">Leadership</h2>
            </div>
          </div>

          {leadersLoading ? (
            <div className="mt-10 flex justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-dv-navy border-r-transparent" />
            </div>
          ) : leaders.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200/90 bg-white/90 py-12 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-dv-sky/40 text-slate-500">
                <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-sm text-slate-600">Leadership profiles coming soon.</p>
              <Link
                href="/leadership"
                className="mt-4 inline-block text-sm font-semibold text-dv-navy underline-offset-4 hover:underline"
              >
                Leadership page
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((leader, index) => (
                <div
                  key={leader.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md scroll-reveal"
                  data-scroll-reveal
                  style={{ transitionDelay: getStaggerDelay(index) }}
                >
                  <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-dv-sky/50 ring-1 ring-slate-200/80 sm:h-32 sm:w-32">
                    {leader.imageUrl ? (
                      <img
                        src={leader.imageUrl}
                        alt={leader.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-dv-navy/35">
                        {leader.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-dv-navy">{leader.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{leader.title}</p>
                  {leader.bio ? (
                    <p className="mt-3 text-left text-sm leading-relaxed text-slate-600 line-clamp-4">{leader.bio}</p>
                  ) : null}
                  {leader.xHandle ? (
                    <a
                      href={`https://x.com/${leader.xHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-dv-navy/80 hover:text-blue-700"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      @{leader.xHandle}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 flex justify-center scroll-reveal" data-scroll-reveal style={{ transitionDelay: '180ms' }}>
            <Link
              href="/leadership"
              className="inline-flex items-center justify-center rounded-full border border-dv-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-dv-navy shadow-sm transition-colors hover:bg-dv-sky/50"
            >
              View full team
            </Link>
          </div>
        </div>
      </section>

      <section
        ref={donateRef}
        id="get-involved"
        className="relative scroll-mt-24 overflow-hidden py-14 sm:py-20"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-0 right-0 bg-cover bg-center bg-no-repeat will-change-transform"
            style={{
              top: '-12%',
              height: '124%',
              backgroundImage: DONATE_BG,
              transform: `translate3d(0, ${donateParallaxY}px, 0)`,
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/65" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center text-white scroll-reveal" data-scroll-reveal>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Support Our Work</h2>
            <div className="mx-auto mt-3 flex w-full max-w-xs items-center justify-center gap-3">
              <span className="h-px flex-1 bg-white/40" />
              <span className="text-white/80" aria-hidden>
                *
              </span>
              <span className="h-px flex-1 bg-white/40" />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {LANDING_DONATION_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedDonationAmount(amount)}
                  className={`rounded-none border px-3 py-3 text-lg font-semibold tracking-wide transition-colors sm:text-xl ${
                    selectedDonationAmount === amount
                      ? 'border-white bg-white text-slate-900'
                      : 'border-white/80 bg-transparent text-white hover:bg-white/10'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDonateModalOpen(true)}
              className="mt-8 inline-flex items-center justify-center bg-dv-red px-8 py-3 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-dv-red-hover"
            >
              Donate Now
            </button>
          </div>
        </div>
      </section>

      <section id="news" className="scroll-mt-24 border-t border-slate-100 bg-gradient-to-b from-white via-dv-sky/20 to-dv-sky/35 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-2 text-center scroll-reveal" data-scroll-reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dv-navy/55">Updates</p>
              <h2 className="mt-1 text-2xl font-bold text-dv-navy sm:text-3xl">Latest news</h2>
            </div>
          </div>

          {newsLoading ? (
            <div className="mt-10 flex justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-dv-navy border-r-transparent" />
            </div>
          ) : newsItems.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200/90 bg-white/90 py-12 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-dv-sky/40 text-slate-500">
                <Newspaper className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-sm text-slate-600">No articles yet. Check back soon.</p>
              <Link href="/news" className="mt-4 inline-block text-sm font-semibold text-dv-navy underline-offset-4 hover:underline">
                Go to articles
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
              {newsItems.map((newsItem, index) => (
                <Link
                  key={newsItem.id}
                  href={`/news/${newsItem.id}`}
                  className="group block rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md sm:p-5 scroll-reveal"
                  data-scroll-reveal
                  style={{ transitionDelay: getStaggerDelay(index) }}
                >
                  <div className="mb-3 overflow-hidden rounded-xl">
                    {newsItem.image ? (
                      <img
                        src={newsItem.image}
                        alt={newsItem.title}
                        className="h-36 w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-36 w-full items-center justify-center bg-dv-sky/60">
                        <img
                          src="/images/logo.png"
                          alt=""
                          className="h-14 w-14 object-contain opacity-40"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {newsItem.category && (
                      <span className="inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-dv-navy/80 ring-1 ring-slate-200/80">
                        {newsItem.category}
                      </span>
                    )}
                    <time
                      dateTime={toNewsDate(newsItem.publishedAt || newsItem.createdAt)?.toISOString()}
                      className="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {formatNewsDate(newsItem.publishedAt || newsItem.createdAt)}
                    </time>
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-dv-navy transition-colors group-hover:text-blue-700 sm:text-base">
                    {newsItem.title}
                  </h3>
                  <p className="line-clamp-3 text-xs text-slate-600">{newsItem.description}</p>
                  <span className="mt-3 inline-flex items-center text-xs font-semibold text-dv-navy opacity-0 transition-opacity group-hover:opacity-100">
                    Read more
                    <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 flex justify-center scroll-reveal" data-scroll-reveal style={{ transitionDelay: '180ms' }}>
            <Link
              href="/news"
              className="inline-flex items-center justify-center rounded-full border border-dv-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-dv-navy shadow-sm transition-colors hover:bg-dv-sky/50"
            >
              View all articles
            </Link>
          </div>
        </div>
      </section>

      <section
        id="newsletter-signup"
        className="scroll-mt-24 w-full border-t border-slate-200/90 bg-gradient-to-b from-dv-sky via-dv-sky-deep/90 to-white py-14 sm:py-20"
      >
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6 scroll-reveal" data-scroll-reveal>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-dv-navy/10 shadow-sm">
            <Mail className="h-6 w-6 text-dv-navy" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dv-navy/55">Stay informed</p>
          <h2 className="mt-2 text-2xl font-bold text-dv-navy sm:text-3xl">Newsletter sign up</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Get diaspora voting updates, announcements, and news from {SITE_NAME} in your inbox.
          </p>
          <form onSubmit={onNewsletterBandSubmit} className="mt-8 text-left">
            <label htmlFor="dv-newsletter-band-email" className="sr-only">
              Email address
            </label>
            <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row">
              <input
                id="dv-newsletter-band-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email address"
                value={newsletterBandEmail}
                onChange={(e) => setNewsletterBandEmail(e.target.value)}
                className="min-h-[48px] w-full min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              />
              <button
                type="submit"
                disabled={newsletterBandLoading}
                className="min-h-[48px] shrink-0 rounded-xl bg-dv-red px-6 text-sm font-semibold text-white shadow-md transition-colors hover:bg-dv-red-hover disabled:opacity-60 sm:px-8"
              >
                {newsletterBandLoading ? '…' : 'Subscribe'}
              </button>
            </div>
            {newsletterBandMsg && (
              <p
                className={`mt-3 text-center text-sm ${newsletterBandMsg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {newsletterBandMsg.text}
              </p>
            )}
          </form>
        </div>
      </section>

      <Footer />
      <DonationModal
        isOpen={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
        initialAmount={selectedDonationAmount}
      />

      <Chatbot hideWhatsApp />
    </main>
  )
}
