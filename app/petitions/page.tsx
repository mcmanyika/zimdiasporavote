'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import DonationModal from '@/app/components/DonationModal'
import { getPetitions, getPetitionById, signPetition } from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { Petition } from '@/types'

export default function PetitionsPage() {
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPetitions()
  }, [])

  const loadPetitions = async () => {
    try {
      setLoading(true)
      const publishedPetitions = await getPetitions(true, true) // Only published and active
      setPetitions(publishedPetitions)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load petitions')
      console.error('Error loading petitions:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Take Action</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Petitions</h1>
              <p className="text-sm text-slate-300 sm:text-base">
                Make your voice heard. Sign petitions that matter to you.
              </p>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="text-slate-600">Loading petitions...</p>
          </div>
        </div>
        <CTASection />
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Take Action</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Petitions</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Make your voice heard. Sign petitions that matter to you.
            </p>
          </div>
        </div>
      </section>

      {/* Petitions Content */}
      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {petitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No active petitions at this time.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {petitions.map((petition) => (
                <PetitionCard key={petition.id} petition={petition} onSign={loadPetitions} />
              ))}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <p
                  className="text-xl font-bold uppercase tracking-wide sm:text-2xl"
                  style={{ animation: 'redAlertPulse 1.4s ease-in-out infinite alternate' }}
                >
                  Red Alert!!
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Did you know?
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Our leaders, like Jacob Ngarivhume are now under 24/7 security survellence. The homes of Senator
                  Jameson Timba and Dr Ibbo Mandaza have been marked.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Please make their sacrifices mean something. Share this petition with your family and friends. We
                  need the numbers.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes redAlertPulse {
          0% {
            color: #92400e;
            text-shadow: 0 0 0 rgba(220, 38, 38, 0);
          }
          50% {
            color: #dc2626;
            text-shadow: 0 0 10px rgba(220, 38, 38, 0.35);
          }
          100% {
            color: #991b1b;
            text-shadow: 0 0 14px rgba(153, 27, 27, 0.45);
          }
        }
      `}</style>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  )
}

function PetitionCard({ petition, onSign }: { petition: Petition; onSign: () => void }) {
  const { user, userProfile } = useAuth()
  const [showSignModal, setShowSignModal] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [shareSuccess, setShareSuccess] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [signData, setSignData] = useState({
    name: userProfile?.name || user?.displayName || '',
    email: user?.email || '',
    anonymous: false,
  })

  const progress = Math.min((petition.currentSignatures / petition.goal) * 100, 100)
  const hasExpired = petition.expiresAt && new Date(petition.expiresAt instanceof Date ? petition.expiresAt : (petition.expiresAt as any)?.toDate?.() || new Date()) < new Date()

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigning(true)
    setSignError('')

    try {
      await signPetition(petition.id, {
        userId: user?.uid,
        name: signData.name.trim(),
        email: signData.email.trim(),
        anonymous: signData.anonymous,
      })
      setShowSignModal(false)
      setShowThankYou(true)
      onSign()
    } catch (err: any) {
      setSignError(err.message || 'Failed to sign petition')
    } finally {
      setSigning(false)
    }
  }

  const hasSigned = Boolean(user?.uid && petition.signatures.some((sig) => sig.userId === user.uid))

  const handleShare = async () => {
    const url = `${window.location.origin}/petitions/${petition.id}`
    try {
      await navigator.clipboard.writeText(url)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/petitions/${petition.id}`
    const plainDesc = stripHtml(petition.description || 'Sign this petition')
    const text = `${petition.title}\n\n${plainDesc}\n\n${url}`
    const encodedText = encodeURIComponent(text)
    const whatsappUrl = `https://wa.me/?text=${encodedText}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow">
        {petition.image && (
          <div className="h-48 overflow-hidden">
            <img
              src={petition.image}
              alt={petition.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold flex-1">{petition.title}</h3>
            <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleWhatsAppShare}
                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Share this petition"
                aria-label="Share this petition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
          {shareSuccess && (
            <div className="mb-2 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs text-green-600">
              Link copied!
            </div>
          )}
          <div className="text-slate-600 text-sm mb-4 line-clamp-3 [&>*]:m-0" dangerouslySetInnerHTML={{ __html: petition.description }} />

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-900">
                {petition.currentSignatures} / {petition.goal} signatures
              </span>
              <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-slate-900 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {hasExpired && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              This petition has expired
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href={`/petitions/${petition.id}`}
              className="flex-1 rounded-lg border-2 border-slate-300 px-4 py-2 text-center text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              View Details
            </Link>
            {!hasExpired && (
              <button
                onClick={() => setShowSignModal(true)}
                disabled={hasSigned || !petition.isActive}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  hasSigned
                    ? 'bg-green-600 cursor-not-allowed'
                    : petition.isActive
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                {hasSigned ? 'Signed ✓' : 'Sign'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Sign Petition</h3>
                <button
                  onClick={() => {
                    setShowSignModal(false)
                    setSignError('')
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSign} className="space-y-4">
                {signError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    {signError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signData.name}
                    onChange={(e) => setSignData({ ...signData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={signData.email}
                    onChange={(e) => setSignData({ ...signData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={signData.anonymous}
                    onChange={(e) => setSignData({ ...signData, anonymous: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="ml-2 text-sm text-slate-700">Sign anonymously</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={signing}
                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signing ? 'Signing...' : 'Sign Petition'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignModal(false)
                      setSignError('')
                    }}
                    className="rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Thank You + Donate Appeal Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Green header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-8 text-center text-white">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold">Thank You for Signing!</h3>
              <p className="mt-1 text-sm text-emerald-100">Your signature makes a difference</p>
            </div>
            {/* Body */}
            <div className="px-6 py-6 text-center">
              <p className="mb-2 text-sm text-slate-600">
                Want to go further? A small donation helps us defend Zimbabwe&apos;s Constitution, fund civic education, and hold leaders accountable.
              </p>
              <p className="mb-6 text-xs text-slate-400">
                No amount is too small — every contribution counts.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowThankYou(false)
                    setShowDonationModal(true)
                  }}
                  className="w-full rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Donate Now
                </button>
                <button
                  onClick={() => setShowThankYou(false)}
                  className="w-full rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      <DonationModal isOpen={showDonationModal} onClose={() => setShowDonationModal(false)} />
    </>
  )
}

