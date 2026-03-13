const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, 'utf8')

  const serviceAccountMatch = raw.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(\{[\s\S]*?\n\})/)
  if (serviceAccountMatch && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = serviceAccountMatch[1]
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (trimmed.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY=')) continue
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1)
    if (!process.env[key]) process.env[key] = value
  }
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
    return parsed
  } catch (error) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error.message)
    return null
  }
}

function initAdmin() {
  if (admin.apps.length > 0) return admin.app()

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')

  const serviceAccount = getServiceAccount()
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

function buildDialCode(idd) {
  if (!idd || !idd.root) return null
  const suffixes = Array.isArray(idd.suffixes) ? idd.suffixes : []
  if (suffixes.length === 0) return idd.root
  return `${idd.root}${suffixes[0]}`
}

async function fetchAllCountries() {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,idd')
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: HTTP ${response.status}`)
  }
  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected countries payload format')
  }
  return data
}

async function seedCountryPhoneCodes() {
  loadEnvLocal()
  initAdmin()
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  console.log('Fetching all countries with dial codes...')
  const countries = await fetchAllCountries()

  const records = countries
    .map((country) => {
      const iso2 = String(country?.cca2 || '').toUpperCase()
      const name = String(country?.name?.common || '').trim()
      const dialCode = buildDialCode(country?.idd)
      if (!iso2 || iso2.length !== 2 || !name || !dialCode) return null
      return {
        id: iso2.toLowerCase(),
        iso2,
        name,
        dialCode,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item, idx) => ({
      ...item,
      order: idx + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }))

  console.log(`Seeding ${records.length} countryPhoneCodes documents...`)

  for (const item of records) {
    await db.collection('countryPhoneCodes').doc(item.id).set(item, { merge: true })
  }

  console.log(`Done. Seeded ${records.length} countryPhoneCodes documents.`)
}

seedCountryPhoneCodes().catch((error) => {
  console.error('Failed to seed countryPhoneCodes:', error?.message || error)
  process.exit(1)
})
