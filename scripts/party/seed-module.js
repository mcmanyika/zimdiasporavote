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

function parseDate(dateStr) {
  const [yyyy, mm, dd] = dateStr.split('-').map(Number)
  return new Date(yyyy, mm - 1, dd, 9, 0, 0)
}

const landingPayload = {
  id: 'landing',
  pageTitle: 'NTA Political',
  heroTitle: 'National Transition Authority',
  heroSubtitle:
    'This initiative aims to bring people together to share ideas, skills, and strategies that can help transform Zimbabwe into a world-class economy.',
  foundingStatement:
    'This platform centres on citizen and sector proposals: practical ideas that answer social and economic needs across Zimbabwe, developed openly and grounded in constitutional principles.',
  mission:
    'To invite proposals from every part of society — by sector and by community — and make them visible for discussion, support, and accountable follow-through.',
  vision:
    'A Zimbabwe where policy priorities emerge from transparent public proposals and constitutional safeguards, not closed-door deals.',
  principles: [
    'Constitutional supremacy and term limits',
    'Citizen participation and transparency',
    'Non-violence, dignity, and equal rights',
    'Evidence-based policy and service delivery',
  ],
  heroStats: [
    { label: 'Legislation Passed', value: '1,369' },
    { label: 'Donors', value: '12,000' },
    { label: 'Fund Raised', value: '$85 M' },
    { label: 'Volunteers', value: '30,000' },
  ],
  callToActionText: 'Register your interest to join, organize, or support the party launch.',
  isPublished: true,
}

const events = [
  {
    id: 'party-launch-dialogue-harare',
    title: 'National Launch Dialogue',
    description: 'Consultative launch dialogue on party constitution, values, and transition roadmap.',
    province: 'Harare',
    location: 'Harare',
    eventDate: parseDate('2026-04-20'),
    startTime: '1000 hrs',
    endTime: '1300 hrs',
    isPublished: true,
  },
  {
    id: 'party-youth-consultation-bulawayo',
    title: 'Youth Political Participation Consultation',
    description: 'A youth-focused policy and mobilization consultation.',
    province: 'Bulawayo',
    location: 'Bulawayo',
    eventDate: parseDate('2026-04-25'),
    startTime: '1000 hrs',
    endTime: '1200 hrs',
    isPublished: true,
  },
]

async function seedPartyModule() {
  loadEnvLocal()
  initAdmin()
  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  await db.collection('partyContent').doc('landing').set(
    {
      ...landingPayload,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  )
  console.log('✅ partyContent/landing')

  for (const event of events) {
    await db.collection('partyEvents').doc(event.id).set(
      {
        ...event,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    )
    console.log(`✅ partyEvents/${event.id}`)
  }

  console.log(`Done. Seeded party module (1 content doc, ${events.length} events).`)
}

seedPartyModule().catch((error) => {
  console.error('Failed to seed party module:', error?.message || error)
  process.exit(1)
})
