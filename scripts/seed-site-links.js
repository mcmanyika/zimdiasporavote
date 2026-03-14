const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, 'utf8')

  // Handle multi-line JSON service account block.
  const serviceAccountMatch = raw.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(\{[\s\S]*?\n\})/)
  if (serviceAccountMatch && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = serviceAccountMatch[1]
  }

  const lines = raw.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (trimmed.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY=')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
    }
    return parsed
  } catch (error) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error.message)
    return null
  }
}

function initAdmin() {
  if (admin.apps.length > 0) return admin.app()

  const serviceAccount = getServiceAccount()
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')
  }

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    })
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  })
}

const siteLinks = [
  // Header
  { id: 'header-about', label: 'About', url: '/about', section: 'header', order: 1, isActive: true, style: 'link', openInNewTab: false },
  { id: 'header-petitions', label: 'Petitions', url: '/petitions', section: 'header', order: 2, isActive: true, style: 'link', openInNewTab: false },
  { id: 'header-bill-proposals', label: 'Bill Proposals', url: '/bill-proposals', section: 'header', order: 3, isActive: false, style: 'link', openInNewTab: false },
  { id: 'header-articles', label: 'Articles', url: '/news', section: 'header', order: 3, isActive: true, style: 'link', openInNewTab: false },
  { id: 'header-join', label: 'Join DCP', url: '/membership-application', section: 'header', order: 4, isActive: true, style: 'button', openInNewTab: false },
  { id: 'header-contact', label: 'Contact', url: '/#contact', section: 'header', order: 5, isActive: true, style: 'link', openInNewTab: false },

  // Footer - App
  {
    id: 'footer-app-android',
    label: 'Download for Android',
    url: 'https://expo.dev/artifacts/eas/hopnYPS9wRJX8ugWGP9Uhz.apk',
    section: 'footer_app',
    order: 1,
    isActive: true,
    openInNewTab: true,
    description: 'Download our Android app for quick access.',
  },

  // Footer - Quick links
  { id: 'footer-quick-about', label: 'About Us', url: '/about', section: 'footer_quick', order: 1, isActive: true, openInNewTab: false },
  { id: 'footer-quick-work', label: 'Our Work', url: '/our-work', section: 'footer_quick', order: 2, isActive: true, openInNewTab: false },
  { id: 'footer-quick-leadership', label: 'Leadership', url: '/leadership', section: 'footer_quick', order: 3, isActive: true, openInNewTab: false },
  { id: 'footer-quick-gallery', label: 'Gallery', url: '/gallery', section: 'footer_quick', order: 4, isActive: true, openInNewTab: false },
  { id: 'footer-quick-surveys', label: 'Surveys', url: '/surveys', section: 'footer_quick', order: 5, isActive: true, openInNewTab: false },
  { id: 'footer-quick-join', label: 'Join DCP', url: '/membership-application', section: 'footer_quick', order: 6, isActive: true, openInNewTab: false },

  // Footer - More links
  { id: 'footer-more-shop', label: 'Shop', url: '/shop', section: 'footer_more', order: 1, isActive: true, openInNewTab: false },
  { id: 'footer-more-articles', label: 'Articles', url: '/news', section: 'footer_more', order: 2, isActive: true, openInNewTab: false },
  { id: 'footer-more-bill-proposals', label: 'Bill Proposals', url: '/bill-proposals', section: 'footer_more', order: 3, isActive: true, openInNewTab: false },
  { id: 'footer-more-videos', label: 'Videos', url: '/videos', section: 'footer_more', order: 4, isActive: true, openInNewTab: false },
  { id: 'footer-more-twitter-live', label: 'Twitter Live', url: '/twitter-live', section: 'footer_more', order: 5, isActive: true, openInNewTab: false },
  { id: 'footer-more-contact', label: 'Contact', url: '/#contact', section: 'footer_more', order: 6, isActive: true, openInNewTab: false },
  // Legacy item cleanup: keep doc but hide it from footer_more list.
  { id: 'footer-more-useful-links', label: 'Parliament Of Zimbawe', url: 'https://www.parlzim.gov.zw/', section: 'footer_more', order: 99, isActive: false, openInNewTab: true },

  // Footer - Useful links
  { id: 'footer-useful-parlzim', label: 'Parliment Of Zimbabwe', url: 'https://www.parlzim.gov.zw/', section: 'footer_useful', order: 1, isActive: true, openInNewTab: true },
  { id: 'footer-useful-public-hearings', label: 'Public Hearings', url: '/public-hearings', section: 'footer_useful', order: 2, isActive: true, openInNewTab: false },

  // Footer - Social
  { id: 'footer-social-x', label: 'X', url: 'https://x.com/DCPlatform25', section: 'footer_social', order: 1, isActive: true, openInNewTab: true, iconKey: 'x' },
  { id: 'footer-social-facebook', label: 'Facebook', url: 'https://www.facebook.com/share/1C4G3L4eka/', section: 'footer_social', order: 2, isActive: true, openInNewTab: true, iconKey: 'facebook' },
  { id: 'footer-social-youtube', label: 'YouTube', url: 'https://youtube.com/@defendtheconstitutionplatform', section: 'footer_social', order: 3, isActive: true, openInNewTab: true, iconKey: 'youtube' },
  { id: 'footer-social-tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@defend.the.consti', section: 'footer_social', order: 4, isActive: true, openInNewTab: true, iconKey: 'tiktok' },
  { id: 'footer-social-instagram', label: 'Instagram', url: 'https://www.instagram.com/dcplaform25', section: 'footer_social', order: 5, isActive: true, openInNewTab: true, iconKey: 'instagram' },
  { id: 'footer-social-whatsapp', label: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VbCeX3FATRSwXmceVg3z', section: 'footer_social', order: 6, isActive: true, openInNewTab: true, iconKey: 'whatsapp' },
]

async function seedSiteLinks() {
  loadEnvLocal()
  initAdmin()
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()
  let success = 0

  console.log(`Seeding ${siteLinks.length} site links...`)

  for (const link of siteLinks) {
    const ref = db.collection('siteLinks').doc(link.id)
    const payload = {
      ...link,
      createdAt: now,
      updatedAt: now,
    }
    await ref.set(payload, { merge: true })
    success += 1
    console.log(`✅ ${link.id}`)
  }

  console.log(`Done. Seeded ${success}/${siteLinks.length} siteLinks documents.`)
}

seedSiteLinks().catch((error) => {
  console.error('Failed to seed siteLinks:', error?.message || error)
  process.exit(1)
})
