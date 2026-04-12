'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSiteLinks } from '@/lib/firebase/firestore'

interface FooterLinkItem {
  id: string
  label: string
  url: string
  order: number
  openInNewTab?: boolean
  description?: string
  iconKey?: string
}

const now = new Date()
const fallbackAppLink: FooterLinkItem = {
  id: 'footer-app-android',
  label: 'Download for Android',
  url: 'https://expo.dev/artifacts/eas/hopnYPS9wRJX8ugWGP9Uhz.apk',
  order: 1,
  openInNewTab: true,
  description: 'Download our Android app for quick access.',
}

const fallbackQuickLinks: FooterLinkItem[] = [
  { id: 'footer-quick-about', label: 'About Us', url: '/about', order: 1 },
  { id: 'footer-quick-work', label: 'Our Work', url: '/our-work', order: 2 },
  { id: 'footer-quick-leadership', label: 'Leadership', url: '/leadership', order: 3 },
  { id: 'footer-quick-gallery', label: 'Gallery', url: '/gallery', order: 4 },
  { id: 'footer-quick-surveys', label: 'Surveys', url: '/surveys', order: 5 },
  { id: 'footer-quick-join', label: 'Join Diaspora Vote', url: '/membership-application', order: 6 },
]

const fallbackMoreLinks: FooterLinkItem[] = [
  { id: 'footer-more-shop', label: 'Shop', url: '/shop', order: 1 },
  { id: 'footer-more-articles', label: 'Articles', url: '/news', order: 2 },
  { id: 'footer-more-videos', label: 'Videos', url: '/videos', order: 4 },
  { id: 'footer-more-twitter-live', label: 'Twitter Live', url: '/twitter-live', order: 5 },
  { id: 'footer-more-report-violence', label: 'Report violence on X', url: '/report-violence-posts', order: 6 },
  { id: 'footer-more-contact', label: 'Contact', url: '/#contact', order: 7 },
]

const fallbackUsefulLinks: FooterLinkItem[] = [
  { id: 'footer-useful-parlzim', label: 'Parliment Of Zimbabwe', url: 'https://www.parlzim.gov.zw/', order: 1, openInNewTab: true },
  { id: 'footer-useful-public-hearings', label: 'Public Hearings', url: '/public-hearings', order: 2 },
]

const fallbackSocialLinks: FooterLinkItem[] = [
  { id: 'footer-social-x', label: 'X', url: 'https://x.com/DiasporaVote', order: 1, iconKey: 'x', openInNewTab: true },
  { id: 'footer-social-facebook', label: 'Facebook', url: 'https://www.facebook.com/share/1C4G3L4eka/', order: 2, iconKey: 'facebook', openInNewTab: true },
  { id: 'footer-social-youtube', label: 'YouTube', url: 'https://youtube.com/@DiasporaVote', order: 3, iconKey: 'youtube', openInNewTab: true },
  { id: 'footer-social-tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@defend.the.consti', order: 4, iconKey: 'tiktok', openInNewTab: true },
  { id: 'footer-social-instagram', label: 'Instagram', url: 'https://www.instagram.com/dcplaform25', order: 5, iconKey: 'instagram', openInNewTab: true },
  { id: 'footer-social-whatsapp', label: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VbCeX3FATRSwXmceVg3z', order: 6, iconKey: 'whatsapp', openInNewTab: true },
]

function normalizeLinks(raw: any[]): FooterLinkItem[] {
  return raw
    .map((item) => ({
      id: String(item.id || ''),
      label: String(item.label || ''),
      url: String(item.url || ''),
      order: Number(item.order || 0),
      openInNewTab: Boolean(item.openInNewTab),
      description: item.description ? String(item.description) : undefined,
      iconKey: item.iconKey ? String(item.iconKey) : undefined,
    }))
    .filter((item) => item.id && item.label && item.url)
    .sort((a, b) => a.order - b.order)
}

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function socialHoverClass(iconKey?: string): string {
  switch ((iconKey || '').toLowerCase()) {
    case 'facebook':
      return 'hover:text-[#1877F2]'
    case 'youtube':
      return 'hover:text-[#FF0000]'
    case 'instagram':
      return 'hover:text-[#E4405F]'
    case 'whatsapp':
      return 'hover:text-[#25D366]'
    default:
      return 'hover:text-white'
  }
}

function renderSocialIcon(iconKey?: string) {
  switch ((iconKey || '').toLowerCase()) {
    case 'facebook':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    case 'x':
    default:
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
  }
}

export default function Footer() {
  const [appLink, setAppLink] = useState<FooterLinkItem>(fallbackAppLink)
  const [quickLinks, setQuickLinks] = useState<FooterLinkItem[]>(fallbackQuickLinks)
  const [moreLinks, setMoreLinks] = useState<FooterLinkItem[]>(fallbackMoreLinks)
  const [usefulLinks, setUsefulLinks] = useState<FooterLinkItem[]>(fallbackUsefulLinks)
  const [socialLinks, setSocialLinks] = useState<FooterLinkItem[]>(fallbackSocialLinks)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const [app, quick, more, useful, social] = await Promise.all([
          getSiteLinks('footer_app'),
          getSiteLinks('footer_quick'),
          getSiteLinks('footer_more'),
          getSiteLinks('footer_useful'),
          getSiteLinks('footer_social'),
        ])

        if (!isMounted) return

        const appItems = normalizeLinks(app as any[])
        const quickItems = normalizeLinks(quick as any[])
        const moreItems = normalizeLinks(more as any[])
        const usefulItems = normalizeLinks(useful as any[])
        const socialItems = normalizeLinks(social as any[])

        if (appItems.length > 0) setAppLink(appItems[0])
        if (quickItems.length > 0) setQuickLinks(quickItems)
        if (moreItems.length > 0) setMoreLinks(moreItems)
        if (usefulItems.length > 0) setUsefulLinks(usefulItems)
        if (socialItems.length > 0) setSocialLinks(socialItems)
      } catch (error) {
        console.error('Failed to load footer links:', error)
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <footer className="border-t border-blue-900/60 bg-blue-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 md:grid-cols-5">
          <div>
            <h3 className="mb-3 text-xs font-semibold">Get the App</h3>
            <p className="mb-3 text-xs text-blue-100/70">
              {appLink.description || 'Download our Android app for quick access.'}
            </p>
            <a
              href={appLink.url}
              target={appLink.openInNewTab ? '_blank' : undefined}
              rel={appLink.openInNewTab ? 'noopener noreferrer' : undefined}
              download
              className="inline-flex items-center gap-2 rounded-md bg-yellow-500 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-yellow-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.523 2.237a.625.625 0 0 0-.853.221l-1.09 1.837A7.628 7.628 0 0 0 12 3.5a7.628 7.628 0 0 0-3.58.795L7.33 2.458a.625.625 0 0 0-1.074.632l1.046 1.764A7.953 7.953 0 0 0 4 11h16a7.953 7.953 0 0 0-3.302-6.146l1.046-1.764a.625.625 0 0 0-.221-.853zM9 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 12v7a2 2 0 0 0 2 2h1v3a1.5 1.5 0 0 0 3 0v-3h4v3a1.5 1.5 0 0 0 3 0v-3h1a2 2 0 0 0 2-2v-7H4zm-2.5 0A1.5 1.5 0 0 0 0 13.5v5A1.5 1.5 0 0 0 3 18.5v-5A1.5 1.5 0 0 0 1.5 12zm21 0a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 3 0v-5a1.5 1.5 0 0 0-1.5-1.5z" />
              </svg>
              {appLink.label}
            </a>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold">Quick Links</h3>
            <ul className="space-y-1.5 text-xs text-blue-100/70">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  {isExternal(link.url) || link.openInNewTab ? (
                    <a
                      href={link.url}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="hover:text-yellow-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.url} className="hover:text-yellow-300 transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-3 h-4"></div>
            <ul className="space-y-1.5 text-xs text-blue-100/70">
              {moreLinks.map((link) => (
                <li key={link.id}>
                  {isExternal(link.url) || link.openInNewTab ? (
                    <a
                      href={link.url}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="hover:text-yellow-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.url} className="hover:text-yellow-300 transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold">Useful Links</h3>
            <ul className="space-y-1.5 text-xs text-blue-100/70">
              {usefulLinks.map((link) => (
                <li key={link.id}>
                  {isExternal(link.url) || link.openInNewTab ? (
                    <a
                      href={link.url}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="hover:text-yellow-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.url} className="hover:text-yellow-300 transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold">Follow Us</h3>
            <p className="mb-3 text-xs text-blue-100/70">
              Connect with us on social media.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.openInNewTab !== false ? '_blank' : undefined}
                  rel={link.openInNewTab !== false ? 'noopener noreferrer' : undefined}
                  className={`text-blue-100/70 transition-colors ${socialHoverClass(link.iconKey)}`}
                  aria-label={link.label}
                >
                  {renderSocialIcon(link.iconKey)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-blue-900/60 pt-4 text-center text-[10px] text-blue-100/70 sm:text-xs">
          <p>&copy; {now.getFullYear()} Diaspora Vote. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/privacy" className="hover:text-yellow-300 transition-colors">Privacy Policy</Link>
            <span className="mx-1.5">·</span>
            <Link href="/terms" className="hover:text-yellow-300 transition-colors">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
