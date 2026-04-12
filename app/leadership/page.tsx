'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Link from 'next/link'
import { getLeaders } from '@/lib/firebase/firestore'
import type { Leader } from '@/types'

export default function LeadershipPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const data = await getLeaders(true) // active only
        setLeaders(data)
      } catch (err) {
        console.error('Error fetching leaders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaders()
  }, [])

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Our People</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Leadership</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Meet the team driving the Diaspora Vote forward
            </p>
          </div>
        </div>
      </section>

      {/* Leaders Grid */}
      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                <p className="text-slate-600">Loading leadership team...</p>
              </div>
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">Leadership team information coming soon.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className="group rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Photo */}
                  <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full bg-slate-100 sm:h-40 sm:w-40">
                    {leader.imageUrl ? (
                      <img
                        src={leader.imageUrl}
                        alt={leader.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-300">
                        {leader.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name & Title */}
                  <h3 className="text-lg font-bold text-slate-900">{leader.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{leader.title}</p>

                  {/* Bio */}
                  {leader.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">
                      {leader.bio}
                    </p>
                  )}

                  {/* X Handle */}
                  {leader.xHandle && (
                    <a
                      href={`https://x.com/${leader.xHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      @{leader.xHandle}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-8 text-white sm:py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">Join Our Movement</h2>
          <p className="mb-6 text-sm text-slate-300 sm:text-base">
            Stand with us in defending the Constitution and protecting democratic values for all Zimbabweans.
          </p>
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
            >
              Join the Platform
            </Link>
            <Link
              href="/#contact"
              className="inline-flex w-full items-center justify-center rounded-md border-2 border-white px-5 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors sm:w-auto sm:px-6 sm:py-3 sm:text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
