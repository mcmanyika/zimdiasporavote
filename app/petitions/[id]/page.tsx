'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import DonationModal from '@/app/components/DonationModal'
import { getPetitionById, signPetition } from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { Petition } from '@/types'

export default function PetitionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const [petition, setPetition] = useState<Petition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSignModal, setShowSignModal] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const [signData, setSignData] = useState({
    name: userProfile?.name || user?.displayName || '',
    email: user?.email || '',
    anonymous: false,
  })
  const [shareSuccess, setShareSuccess] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadPetition(params.id as string)
    }
  }, [params.id])

  const loadPetition = async (id: string) => {
    try {
      setLoading(true)
      const data = await getPetitionById(id)
      if (!data || !data.isPublished || !data.isActive) {
        setError('Petition not found or no longer active')
        return
      }
      setPetition(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load petition')
      console.error('Error loading petition:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendPetitionConfirmationEmail = async (payload: { name: string; email: string; petitionTitle: string; petitionId: string }) => {
    try {
      const baseUrl = window.location.origin
      const donateUrl = `${baseUrl}/#donate`
      const bodyText = `Thank you for signing "${payload.petitionTitle}".\n\nYour voice has been recorded, and it strengthens this constitutional campaign.\n\nDid you know?\n\nSome of our leaders, including Jacob Ngarivhume, can no longer live in their own homes. Security personnel are camped outside 24/7. The homes of Senator Jameson Timba and Dr Ibbo Mandaza have been marked.\n\nPlease make their sacrifices mean something. Share this petition with your family and friends. We need the numbers.\n\nConsider making a donation of any amount. Every contribution helps strengthen civic voices when they are under threat.\n\nDonate: ${donateUrl}`
      const htmlBody = `
        <p>Thank you for signing "${payload.petitionTitle}".</p>
        <p>Your voice has been recorded, and it strengthens this constitutional campaign.</p>
        <p><strong>Did you know?</strong></p>
        <p>Some of our leaders, including Jacob Ngarivhume, can no longer live in their own homes. Security personnel are camped outside 24/7. The homes of Senator Jameson Timba and Dr Ibbo Mandaza have been marked.</p>
        <p>Please make their sacrifices mean something. Share this petition with your family and friends. We need the numbers.</p>
        <p>Consider making a donation of any amount. Every contribution helps strengthen civic voices when they are under threat.</p>
        <p style="margin:20px 0 0;">
          <a href="${donateUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">Donate</a>
        </p>
      `.trim()

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          name: payload.name,
          subject: 'Thank you for signing the petition',
          body: bodyText,
          htmlBody,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.text()
        console.error('Petition confirmation email request failed:', res.status, errorBody)
      }
    } catch (err) {
      console.error('Failed to send petition confirmation email:', err)
    }
  }

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!petition) return

    setSigning(true)
    setSignError('')

    try {
      await signPetition(petition.id, {
        userId: user?.uid,
        name: signData.name.trim(),
        email: signData.email.trim(),
        anonymous: signData.anonymous,
      })
      void sendPetitionConfirmationEmail({
        name: signData.name.trim(),
        email: signData.email.trim(),
        petitionTitle: petition.title,
        petitionId: petition.id,
      })
      setShowSignModal(false)
      setShowThankYou(true)
      await loadPetition(petition.id)
    } catch (err: any) {
      setSignError(err.message || 'Failed to sign petition')
    } finally {
      setSigning(false)
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
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Petition</h1>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="text-slate-600">Loading petition...</p>
          </div>
        </div>
        <CTASection />
        <Footer />
      </main>
    )
  }

  if (error || !petition) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Take Action</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Petition</h1>
            </div>
          </div>
        </section>
        <div className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'Petition not found'}</p>
              <Link
                href="/petitions"
                className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Back to Petitions
              </Link>
            </div>
          </div>
        </div>
        <CTASection />
        <Footer />
      </main>
    )
  }

  const progress = Math.min((petition.currentSignatures / petition.goal) * 100, 100)
  const hasExpired = petition.expiresAt && new Date(petition.expiresAt instanceof Date ? petition.expiresAt : (petition.expiresAt as any)?.toDate?.() || new Date()) < new Date()
  const hasSigned = Boolean(user?.uid && petition.signatures.some((sig) => sig.userId === user.uid))

  const handleShare = async () => {
    const url = window.location.href
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
    const url = window.location.href
    const plainDesc = stripHtml(petition.description || 'Sign this petition')
    const text = `${petition.title}\n\n${plainDesc}\n\n${url}`
    const encodedText = encodeURIComponent(text)
    const whatsappUrl = `https://wa.me/?text=${encodedText}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Take Action</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Petition</h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link
            href="/petitions"
            className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Petitions
          </Link>

          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {petition.image && (
              <div className="h-64 md:h-96 overflow-hidden">
                <img
                  src={petition.image}
                  alt={petition.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold flex-1">{petition.title}</h1>
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-2 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                    title="Share on WhatsApp"
                    aria-label="Share on WhatsApp"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Share this petition"
                    aria-label="Share this petition"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-lg font-extrabold uppercase tracking-wide text-red-700 animate-pulse sm:text-xl">
                  Red Alert!!
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Did you know?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Some of our leaders, including Jacob Ngarivhume, can no longer live in their own homes. Security
                  personnel are camped outside 24/7. The homes of Senator Jameson Timba and Dr Ibbo Mandaza have been
                  marked.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Please make their sacrifices mean something. Share this petition with your family and friends. We
                  need the numbers.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-800 sm:text-base">
                  Consider making a donation of any amount. Every contribution helps strengthen civic voices when they
                  are under threat.
                </p>
                <div className="mt-4">
                  <Link
                    href="/#donate"
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Donate
                  </Link>
                </div>
              </div>
              {shareSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-600">
                  Link copied to clipboard!
                </div>
              )}
              <div className="text-lg text-slate-600 mb-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: petition.description }} />

              {petition.content && (
                <div className="prose max-w-none mb-8 text-slate-700" dangerouslySetInnerHTML={{ __html: petition.content }} />
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-slate-900">
                    {petition.currentSignatures} / {petition.goal} signatures
                  </span>
                  <span className="text-lg text-slate-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-slate-900 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {hasExpired && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  This petition has expired
                </div>
              )}

              {!hasExpired && petition.isActive && (
                <button
                  onClick={() => setShowSignModal(true)}
                  disabled={hasSigned}
                  className={`w-full rounded-lg px-6 py-3 text-base font-semibold text-white transition-colors ${
                    hasSigned
                      ? 'bg-green-600 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {hasSigned ? '✓ You have signed this petition' : 'Sign This Petition'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

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

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  )
}

