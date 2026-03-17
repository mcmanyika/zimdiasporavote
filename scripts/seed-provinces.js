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

const provinces = [
  { id: 'bulawayo', name: 'Bulawayo' },
  { id: 'harare', name: 'Harare' },
  { id: 'manicaland', name: 'Manicaland' },
  { id: 'mashonaland-central', name: 'Mashonaland Central' },
  { id: 'mashonaland-east', name: 'Mashonaland East' },
  { id: 'mashonaland-west', name: 'Mashonaland West' },
  { id: 'masvingo', name: 'Masvingo' },
  { id: 'matabeleland-north', name: 'Matabeleland North' },
  { id: 'matabeleland-south', name: 'Matabeleland South' },
  { id: 'midlands', name: 'Midlands' },
]

async function seedProvinces() {
  loadEnvLocal()
  initAdmin()
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  console.log(`Seeding ${provinces.length} provinces...`)
  for (let i = 0; i < provinces.length; i += 1) {
    const province = provinces[i]
    await db.collection('provinces').doc(province.id).set(
      {
        id: province.id,
        name: province.name,
        country: 'Zimbabwe',
        order: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    )
  }
  console.log(`Done. Seeded ${provinces.length} provinces.`)
}

seedProvinces().catch((error) => {
  console.error('Failed to seed provinces:', error?.message || error)
  process.exit(1)
})
