'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DonationModal from '@/app/components/DonationModal'
import { getPartyEvents, getPartyLandingContent } from '@/features/party'
import type { PartyEvent, PartyHeroStat, PartyLandingContent } from '@/features/party'
import { useAuth } from '@/contexts/AuthContext'

const roleOptions = [
  'Member',
  'Volunteer Organizer',
  'Youth Mobilizer',
  'Policy / Research Support',
  'Communications / Media Support',
  'Donor / Fundraising Support',
]
const defaultRoleInterest = roleOptions[0]
const defaultContributionMessage = 'Interested in joining the political party launch.'
const defaultProvince = 'Not specified'

const campaignHighlights = [
  {
    title: 'Legislative Efforts',
    text: 'Drive petitions, community consultations, and policy advocacy in every province.',
    cta: 'VIEW MORE',
    image: '/images/life.png',
  },
  {
    title: 'Fundraising & Donations',
    text: 'Build a broad grassroots supporter base through transparent small-donor funding.',
    cta: 'How you can help',
    image: '/images/sports.png',
  },
  {
    title: 'Volunteer Organizing',
    text: 'Recruit, train, and coordinate local volunteer teams for long-term mobilization.',
    cta: 'VIEW MORE',
    image: '/images/students.png',
  },
]

const issueShowcase = [
  {
    title: 'Issues',
    description:
      'Whether it’s getting petition signatures, creating thousands of citizen video appeals to send to Congress, or mobilizing supporters to hit the streets, we specialize in innovative advocacy campaigns that make waves.',
    image:
      'https://vox-populi.bold-themes.com/grassroot/wp-content/uploads/sites/4/2019/03/case_study_1.jpg',
    cta: 'VIEW MORE',
  },
  {
    title: 'Legislative Efforts',
    description:
      'We’ve helped build the small-donor membership base of some of the best and biggest groups through millions of one-on-one conversations with supporters across the country. We prioritize quality civic engagement in every campaign.',
    image: '/images/parliament.png',
    cta: 'VIEW MORE',
  },
]
const heroNavItems = ['About', 'Contribute', 'News', 'Shop']
const partyFooterQuickLinks = [
  { label: 'Vision', href: '/party' },
  { label: 'Leadership Nominations', href: '/dashboard/party-nominations' },
  { label: 'Vote for Candidates', href: '/dashboard/party-nominations' },
  { label: 'Join the Movement', href: '/membership-application' },
  { label: 'Events', href: '/party' },
  { label: 'Volunteer Network', href: '/volunteer' },
]
const partyFooterMoreLinks = [
  { label: 'Policy Priorities', href: '/party' },
  { label: 'Provincial Structures', href: '/party' },
  { label: 'Youth Wing', href: '/dashboard/youth' },
  { label: 'Women’s Wing', href: '/party' },
  { label: 'Manifesto', href: '/party' },
  { label: 'Campaign Updates', href: '/news' },
]
const partyFooterUsefulLinks = [
  { label: 'Parliament of Zimbabwe', href: 'https://www.parlzim.gov.zw/', external: true },
  { label: 'Public Hearings', href: '/public-hearings' },
  { label: 'Electoral Commission (ZEC)', href: 'https://www.zec.org.zw/', external: true },
  { label: 'Constitution of Zimbabwe', href: 'https://www.veritaszim.net/node/318', external: true },
]
const partyFooterSocialLinks = [
  { label: 'X (Party Updates)', href: 'https://x.com/DCPlatform25' },
  { label: 'Facebook (Community)', href: 'https://www.facebook.com/share/1C4G3L4eka/' },
  { label: 'YouTube (Live & Briefings)', href: 'https://youtube.com/@defendtheconstitutionplatform' },
  { label: 'WhatsApp Channel', href: 'https://whatsapp.com/channel/0029VbCeX3FATRSwXmceVg3z' },
]
const defaultHeroStats: PartyHeroStat[] = [
  { label: 'Legislation Passed', value: '1,369' },
  { label: 'Donors', value: '12,000' },
  { label: 'Fund Raised', value: '$85 M' },
  { label: 'Volunteers', value: '30,000' },
]

const defaultContent: PartyLandingContent = {
  id: 'landing',
  pageTitle: 'DCP Political',
  heroTitle: 'A New Political Party Rooted in Constitutionalism',
  heroSubtitle: '',
  foundingStatement: 'This initiative seeks to transform constitutional advocacy into an accountable, democratic political platform.',
  mission: 'To build a citizen-led political movement that protects constitutionalism, rule of law, and social justice.',
  vision: 'A constitutional Zimbabwe with accountable leadership and inclusive national development.',
  principles: [
    'Constitutional supremacy and term limits',
    'Citizen participation and transparency',
    'Non-violence, dignity, and equal rights',
    'Evidence-based policy and service delivery',
  ],
  heroStats: defaultHeroStats,
  callToActionText: 'Register your interest to join, organize, or support the party launch.',
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export default function PartyLandingPage() {
  return (
    <ProtectedRoute>
      <AdminRoute minAccessLevel={5}>
        <PartyLandingContent />
      </AdminRoute>
    </ProtectedRoute>
  )
}

function PartyLandingContent() {
  const { user, userProfile, logout, loading: authLoading } = useAuth()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const [content, setContent] = useState<PartyLandingContent>(defaultContent)
  const [events, setEvents] = useState<PartyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState('')
  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    province: defaultProvince,
    district: '',
    roleInterest: defaultRoleInterest,
    message: defaultContributionMessage,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [landing, upcoming] = await Promise.all([
          getPartyLandingContent(),
          getPartyEvents(true),
        ])
        if (landing?.isPublished) setContent(landing)
        setEvents(upcoming)
      } catch (err: any) {
        setError(err?.message || 'Failed to load party page.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [accountMenuOpen])

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.eventDate as any).getTime() - new Date(b.eventDate as any).getTime()
      ),
    [events]
  )
  const heroStats = useMemo(() => {
    const fromDb = content.heroStats || []
    const fallback = defaultHeroStats
    return (fromDb.length ? fromDb : fallback).slice(0, 4)
  }, [content.heroStats])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSubmittedId('')

    try {
      const response = await fetch('/api/party/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || 'Failed to submit form.')
      setSubmittedId(String(json?.id || ''))
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        province: defaultProvince,
        district: '',
        roleInterest: defaultRoleInterest,
        message: defaultContributionMessage,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to submit form.')
    } finally {
      setSubmitting(false)
    }
  }

  const openDonationModal = () => {
    setDonationModalOpen(true)
  }

  const closeDonationModal = () => {
    setDonationModalOpen(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative min-h-screen overflow-hidden bg-[#0f56d9] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,86,217,0.62),rgba(15,86,217,0.56))]" />
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-35 will-change-transform"
          style={{
            backgroundImage: "url('/images/party/great_zimbabwe.png')",
            transform: `translate3d(0, ${Math.min(scrollY * 0.14, 240)}px, 0) scale(1.08)`,
          }}
        />

        <div className="relative flex min-h-screen flex-col">
          <div className="border-b border-white/20">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-blue-100 sm:px-6">
              <p>Call Us: (+263) 71 876 5864</p>
              <p>Follow us</p>
            </div>
          </div>

          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="text-3xl font-extrabold tracking-tight">DCP</div>
            <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
              {heroNavItems.map((item) => (
                <a key={item} href="#" className="text-white/90 hover:text-white">
                  {item}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {authLoading ? (
                <span className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 sm:text-sm">
                  Loading...
                </span>
              ) : user ? (
                <div className="relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="flex max-w-[180px] items-center gap-2 rounded-full border border-white/45 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 sm:max-w-[220px] sm:text-sm"
                  >
                    <span className="truncate">{userProfile?.name || user.email?.split('@')[0] || 'Account'}</span>
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                    </svg>
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
                      <Link
                        href="/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm font-medium text-white/95 hover:bg-white/10"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false)
                          void logout()
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-white/95 hover:bg-white/10"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-white/45 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/10 sm:text-sm"
                >
                  Sign In
                </Link>
              )}
              <button
                type="button"
                onClick={openDonationModal}
                className="rounded-full bg-rose-600 px-5 py-2 text-sm font-bold uppercase tracking-wide hover:bg-rose-500"
              >
                Donate
              </button>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">{content.pageTitle}</p>
              <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                We are the change!
              </h1>
              <p className="mt-4 max-w-3xl text-sm text-blue-100 sm:text-base">{content.heroSubtitle}</p>
              <div className="mt-8">
                <a href="#join-party" className="inline-flex items-center rounded-full bg-rose-600 px-10 py-4 text-base font-bold uppercase tracking-wide text-white hover:bg-rose-500">
                  Let's Work Together
                </a>
              </div>
            </div>

            <aside id="join-party" className="order-1 w-full rounded-2xl border border-[#7fb3ff] bg-transparent p-5 text-white lg:order-2 lg:ml-auto lg:max-w-lg">
              <h2 className="text-lg font-semibold text-white">Let's Work Together</h2>
              <p className="mt-2 text-sm text-blue-100">
                {content.callToActionText || 'Tell us how you want to participate in the party launch process.'}
              </p>

              {submittedId && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  Submission received. Reference: {submittedId}
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <input
                  required
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-100"
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-100"
                />
                <input
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-100"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg border border-[#7fb3ff] bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Join Now'}
                </button>
              </form>
            </aside>
          </div>

          <div className="border-t border-white/25">
            <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <StatCard key={`${stat.label}-${stat.value}`} label={stat.label} value={stat.value} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-5xl">Don’t Get Mad, Get Mobilizing.</h2>
            <p className="mt-4 text-sm text-slate-700 sm:text-base">
              {content.foundingStatement}
            </p>
          </div>

          <div className="relative mt-10 space-y-10 sm:mt-14">
            <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 lg:block" />
            {campaignHighlights.map((item, idx) => (
              <div key={item.title} className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
                <div className={idx % 2 === 0 ? '' : 'lg:order-2'}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-[230px] w-full rounded-xl object-cover shadow-md transition-transform duration-500 hover:scale-[1.03] sm:h-[280px]"
                    loading="lazy"
                  />
                </div>
                <article className={idx % 2 === 0 ? '' : 'lg:order-1'}>
                  <div className="rounded-xl bg-white p-3 sm:p-5">
                    <h3 className="text-3xl font-extrabold text-slate-900">{item.title}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700 sm:text-base">{item.text}</p>
                    <p className="mt-5 text-sm font-bold uppercase tracking-wide text-rose-600">{item.cta}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-center text-2xl font-bold italic text-slate-900 sm:text-3xl">
            “ Somewhere inside of all of us is the power to change the world. ”
          </p>
          <p className="mt-2 text-center text-sm text-slate-600">DCP Founding Leadership</p>
        </div>
      </section>

      <section className="bg-[#b00634] py-10 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-2xl font-medium text-white">Subscribe to our Newsletter</p>
          <form className="flex w-full max-w-lg items-center gap-3">
            <input
              type="email"
              placeholder="Your Email"
              className="h-11 w-full rounded-sm border border-transparent bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500"
            />
            <button
              type="button"
              className="h-11 rounded-full bg-[#052f59] px-6 text-sm font-semibold text-white hover:bg-[#04284b]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-36">
            {issueShowcase.map((item, idx) => (
              <article key={item.title} className={idx % 2 === 1 ? 'lg:mt-36' : ''}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-[230px] w-full rounded-lg object-cover shadow-md transition-transform duration-500 hover:scale-[1.03] sm:h-[290px]"
                  loading="lazy"
                />
                <h3 className="mt-5 text-4xl font-extrabold text-slate-900">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">{item.description}</p>
                <button
                  type="button"
                  className="mt-6 rounded-full bg-[#07315d] px-6 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#052748]"
                >
                  {item.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mt-10 min-h-[320px] overflow-hidden bg-[#0f56d9] text-white sm:min-h-[380px]">
        <div
          className="absolute inset-0 bg-cover bg-top bg-fixed opacity-35"
          style={{ backgroundImage: "url('/images/party/the_people.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,86,217,0.62),rgba(15,86,217,0.56))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-wider text-blue-100">Let's Work Together</p>
          <h3 className="mt-2 text-center text-3xl font-extrabold sm:text-5xl">office@dcpzim.com</h3>
          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="font-bold">WORKING HOURS</p><p className="text-blue-100">Mon - Sat 8.00 - 18.00</p></div>
            <div><p className="font-bold">LOCATION</p><p className="text-blue-100">Harare, Zimbabwe</p></div>
            <div><p className="font-bold">CALL US:</p><p className="text-blue-100">(+263) 71 876 5864</p></div>
            <div><p className="font-bold">EMAIL</p><p className="text-blue-100">office@dcpzim.com</p></div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-6">
            <div className="grid gap-6 text-sm md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="mb-2 font-bold">Quick Links</p>
                <ul className="space-y-1 text-blue-100">
                  {partyFooterQuickLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-bold">More</p>
                <ul className="space-y-1 text-blue-100">
                  {partyFooterMoreLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-bold">Useful Links</p>
                <ul className="space-y-1 text-blue-100">
                  {partyFooterUsefulLinks.map((item) => (
                    <li key={item.label}>
                      {item.external ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                          {item.label}
                        </a>
                      ) : (
                        <Link href={item.href} className="hover:text-white">
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-bold">Follow Us</p>
                <ul className="space-y-1 text-blue-100">
                  {partyFooterSocialLinks.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-black/90">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-[10px] text-white/80 sm:px-6 sm:text-xs">
            <p>&copy; 2026 Defend the Constitution Platform. All rights reserved.</p>
            <p className="mt-1">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <span className="mx-1">·</span>
              <Link href="/terms" className="hover:text-white">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </section>
      <DonationModal
        isOpen={donationModalOpen}
        onClose={closeDonationModal}
        variant="drawer-right"
        description="Donations will support party mobilisation, candidate development, and grassroots organising across Zimbabwe."
      />
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/20 px-4 py-6 text-center last:border-r-0">
      <p className="text-4xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-lg font-semibold text-white">{label}</p>
    </div>
  )
}

function formatDate(value: Date | any): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBC'
  return date.toLocaleDateString()
}
