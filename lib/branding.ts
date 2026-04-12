/**
 * Site-wide branding for Diaspora Vote.
 * Set NEXT_PUBLIC_BASE_URL and NEXT_PUBLIC_CONTACT_EMAIL in .env for production.
 */

export const SITE_NAME = 'Diaspora Vote'
export const SITE_NAME_SHORT = 'DV'
export const SITE_HASHTAG = '#DiasporaVote'
export const SITE_TAGLINE = 'Think Local, go global!'

export function getSiteUrl(): string {
  const base =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : 'https://diasporavote.org'
  return base.replace(/\/$/, '')
}

export const CONTACT_EMAIL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CONTACT_EMAIL
    ? process.env.NEXT_PUBLIC_CONTACT_EMAIL
    : 'contact@diasporavote.org'

/** Public social URLs — update when official accounts are finalized. */
export const SOCIAL_X_URL = 'https://x.com/DiasporaVote'
export const SOCIAL_YOUTUBE_URL = 'https://youtube.com/@DiasporaVote'
export const SOCIAL_FACEBOOK_URL = 'https://www.facebook.com'
