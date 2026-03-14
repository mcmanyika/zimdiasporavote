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
  const [dd, mm, yy] = String(dateStr).split('/')
  const year = Number(`20${yy}`)
  return new Date(year, Number(mm) - 1, Number(dd), 9, 0, 0)
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const teamSchedules = [
  {
    teamCode: 'A',
    province: 'Manicaland',
    rows: [
      { date: '30/03/26', district: 'Nyanga', place: 'Nyamukha Shopping Centre', venue: 'Nyamukha Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Mutasa', place: 'Manica Bridge', venue: 'Manica Bridge Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Makoni', place: 'Chipembere Business Centre', venue: 'Open Space', time: '1000 hrs' },
      { date: '31/03/26', district: 'Mutare', place: 'Sakubva', venue: 'Sakubva Beit Hall', time: '1400 hrs' },
      { date: '01/04/26', district: 'Chipinge', place: 'Rimbi Business Centre', venue: 'Manicaland Development Association Hall', time: '1000 hrs' },
      { date: '01/04/26', district: 'Chimanimani', place: 'Chakohwa', venue: 'Chakohwa Secondary School', time: '1400 hrs' },
      { date: '02/04/26', district: 'Buhera', place: 'Murambinda', venue: 'Better Schools Programme Zimbabwe Hall', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'B',
    province: 'Mashonaland Central',
    rows: [
      { date: '30/03/26', district: 'Bindura', place: 'Chipadze Township', venue: 'Chipadze Council Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Mazowe', place: 'Nzvimbo Business Centre', venue: 'Council Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Mt. Darwin', place: 'Mt. Darwin Town', venue: 'Council Hall', time: '1000 hrs' },
      { date: '31/03/26', district: 'Shamva', place: 'Madziwa Business Centre', venue: 'White House Vocational Training Centre', time: '1400 hrs' },
      { date: '01/04/26', district: 'Muzarabani', place: 'Muzarabani Growth Point', venue: 'Community Hall', time: '1000 hrs' },
      { date: '01/04/26', district: 'Rushinga', place: 'Chimanda Business Centre', venue: 'Council Offices', time: '1000 hrs' },
      { date: '02/04/26', district: 'Mbire', place: 'Mushumbi Pools Business Centre', venue: 'Lower Guruve Development Association Training Centre', time: '1000 hrs' },
      { date: '02/04/26', district: 'Guruve', place: 'Guruve Business Centre', venue: 'Salvation Army Church Hall', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'C',
    province: 'Mashonaland East',
    rows: [
      { date: '30/03/26', district: 'Chikomba', place: 'Sadza', venue: 'Council Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Seke', place: 'Dema Business Centre', venue: 'Council Grounds', time: '1000 hrs' },
      { date: '30/03/26', district: 'Hwedza', place: 'Hwedza Centre', venue: 'Flea Market Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Marondera', place: 'Dombotombo Township', venue: 'Mbuya Nehanda Hall', time: '1000 hrs' },
      { date: '31/03/26', district: 'Goromonzi', place: 'Chishawasha-Donhodzo Township', venue: 'St Peters Claver Primary School Grounds', time: '1400 hrs' },
      { date: '01/04/26', district: 'Uzumba-Maramba-Pfungwe', place: 'Mutawatawa Business Centre', venue: 'Better Schools Programme Zimbabwe Hall', time: '1000 hrs' },
      { date: '01/04/26', district: 'Murehwa', place: 'Murehwa Centre', venue: 'Better Schools Programme Zimbabwe Hall', time: '1400 hrs' },
      { date: '02/04/26', district: 'Mudzi', place: 'Kaitano Business Centre', venue: 'Open Space', time: '1000 hrs' },
      { date: '02/04/26', district: 'Mutoko', place: 'Mutoko Business Centre', venue: 'Better Schools Programme Zimbabwe', time: '1400 hrs' },
    ],
  },
  {
    teamCode: 'D1',
    province: 'Mashonaland West',
    rows: [
      { date: '30/03/26', district: 'Mhondoro-Ngezi', place: 'Mamina Business Centre', venue: 'Mamina Council Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Chegutu', place: 'Chegutu', venue: 'Chegutu Council Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Sanyati', place: 'Chakari Business Centre', venue: 'Patchway Open Space', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'D2',
    province: 'Mashonaland West',
    rows: [
      { date: '30/03/26', district: 'Makonde', place: 'Finland Business Centre', venue: 'Chipfunde Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Zvimba', place: 'Rafingora Business Centre', venue: 'Rafingora Community Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Kariba', place: 'Makande', venue: 'Makande Secondary School', time: '1000 hrs' },
      { date: '01/04/26', district: 'Hurungwe', place: 'Kazangarare Business Centre', venue: 'Ringo Community Hall', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'E',
    province: 'Masvingo',
    rows: [
      { date: '30/03/26', district: 'Chiredzi', place: 'Chiredzi Town', venue: 'Chitsanga Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Zaka', place: 'Rudhanda', venue: 'Rudhanda Secondary School', time: '1400 hrs' },
      { date: '31/03/26', district: 'Bikita', place: 'Matsvange', venue: 'Roman Catholic Church', time: '1000 hrs' },
      { date: '31/03/26', district: 'Gutu', place: 'Maungwa', venue: 'Maungwa Secondary School', time: '1400 hrs' },
      { date: '01/04/26', district: 'Chivi', place: 'Maringire Business Centre', venue: 'Maringire Primary School', time: '1000 hrs' },
      { date: '01/04/26', district: 'Masvingo', place: 'Chidzikwe Business Centre (Big Tent)', venue: 'Chidzikwe Hall', time: '1400 hrs' },
      { date: '02/04/26', district: 'Mwenezi', place: 'Rutenga', venue: 'Mafomoti Secondary School', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'F',
    province: 'Matabeleland North',
    rows: [
      { date: '30/03/26', district: 'Tsholotsho', place: 'Tsholotsho Centre', venue: 'Tsholotsho Council Hall', time: '1000 hrs' },
      { date: '31/03/26', district: 'Hwange', place: 'Hwange Town', venue: 'Admant Hall', time: '1000 hrs' },
      { date: '31/03/26', district: 'Bubi', place: 'Inyathi', venue: 'Tatazela Hall', time: '1000 hrs' },
      { date: '01/04/26', district: 'Binga', place: 'Manjolo Business Centre', venue: 'Sengwe Child Drop-in Centre', time: '1000 hrs' },
      { date: '01/04/26', district: 'Umguza', place: 'Nyamandlovu', venue: 'Redhood Community Hall', time: '1000 hrs' },
      { date: '02/04/26', district: 'Lupane', place: 'Lupane Centre', venue: 'Lupane Council Hall', time: '1000 hrs' },
      { date: '02/04/26', district: 'Nkayi', place: 'Nkayi Business Centre', venue: 'Agape Church', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'G',
    province: 'Matabeleland South',
    rows: [
      { date: '30/03/26', district: 'Umzingwane', place: 'Esigodini', venue: 'Hyn Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Insiza', place: 'Filabusi Centre', venue: 'Insiza Rural District Council Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Bulilima', place: 'Nyele', venue: 'Nyele Community Hall', time: '1000 hrs' },
      { date: '31/03/26', district: 'Mangwe', place: 'Mangwe', venue: 'Sanzukwi Community Hall', time: '1400 hrs' },
      { date: '01/04/26', district: 'Matobo', place: 'Malinde Cattle Sales', venue: 'Open Space', time: '1000 hrs' },
      { date: '01/04/26', district: 'Gwanda', place: 'West Nicholson', venue: 'Gwanda Council Hall', time: '1400 hrs' },
      { date: '02/04/26', district: 'Beitbridge', place: 'Beitbridge', venue: 'Lutumba Warehouse', time: '1000 hrs' },
    ],
  },
  {
    teamCode: 'H',
    province: 'Midlands',
    rows: [
      { date: '30/03/26', district: 'Gokwe South', place: 'Gokwe Centre', venue: 'Gokwe Community Hall', time: '1000 hrs' },
      { date: '30/03/26', district: 'Kwekwe', place: 'Kwekwe Town', venue: 'Kwekwe Theater Hall', time: '1400 hrs' },
      { date: '31/03/26', district: 'Gokwe North', place: 'Nembudziya', venue: 'Nembudziya Council Offices', time: '1000 hrs' },
      { date: '01/04/26', district: 'Gweru', place: 'Vungu', venue: 'Vungu Council Hall', time: '1000 hrs' },
      { date: '01/04/26', district: 'Chirumhanzu', place: 'Mvuma', venue: 'Mvuma Vocational Training Centre', time: '1000 hrs' },
      { date: '01/04/26', district: 'Shurugwi', place: 'Chachacha Business Centre', venue: 'Chachacha Business Centre Hall', time: '1400 hrs' },
      { date: '02/04/26', district: 'Mberengwa', place: 'York Business Centre', venue: 'Zvavshe Secondary School Grounds', time: '1000 hrs' },
      { date: '02/04/26', district: 'Zvishavane', place: 'Vugvi Business Centre', venue: 'Vugvi Community Hall', time: '1400 hrs' },
    ],
  },
  {
    teamCode: 'I',
    province: 'Harare',
    rows: [
      { date: '30/03/26', district: 'Chitungwiza', place: 'Zengeza 4', venue: 'Chitungwiza Aquatic Centre', time: '1400 hrs' },
      { date: '31/03/26', district: 'Epworth', place: 'Epworth Local Board', venue: 'Epworth Local Board Open Space', time: '1000 hrs' },
      { date: '31/03/26', district: 'Harare', place: 'Harare City', venue: 'City Sports Centre', time: '1400 hrs' },
    ],
  },
  {
    teamCode: 'J',
    province: 'Bulawayo',
    rows: [
      { date: '30/03/26', district: 'Bulawayo', place: 'Bulawayo City', venue: 'City Hall', time: '1000 hrs' },
    ],
  },
]

const hearings = teamSchedules.flatMap((team) => {
  return team.rows.map((row, index) => {
    const date = parseDate(row.date)
    const dateKey = date.toISOString().slice(0, 10)
    const districtSlug = slugify(row.district)
    return {
      id: `ph-hb1-2026-${team.teamCode.toLowerCase()}-${dateKey}-${districtSlug}-${index + 1}`,
      title: 'Constitution of Zimbabwe Amendment (No. 3) Bill Public Hearing',
      billCode: 'H.B. 1, 2026',
      teamCode: team.teamCode,
      province: team.province,
      district: row.district,
      locationName: row.place,
      venue: row.venue,
      scheduledDate: date,
      startTime: row.time,
      timezone: 'Africa/Harare',
      status: 'upcoming',
      isPublished: true,
      sourceUrl: 'https://www.parlzim.gov.zw/',
      notes: `Team ${team.teamCode} - ${team.province}`,
    }
  })
})

async function seedPublicHearings() {
  loadEnvLocal()
  initAdmin()

  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()
  const collectionRef = db.collection('publicHearings')
  let success = 0

  console.log('Clearing existing publicHearings documents...')
  const existing = await collectionRef.get()
  const deleteBatch = db.batch()
  existing.docs.forEach((doc) => deleteBatch.delete(doc.ref))
  if (!existing.empty) {
    await deleteBatch.commit()
  }

  console.log(`Seeding ${hearings.length} publicHearings documents...`)

  for (const hearing of hearings) {
    const payload = {
      ...hearing,
      createdAt: now,
      updatedAt: now,
    }
    await collectionRef.doc(hearing.id).set(payload, { merge: true })
    success += 1
    console.log(`✅ ${hearing.id}`)
  }

  console.log(`Done. Seeded ${success}/${hearings.length} publicHearings documents.`)
}

seedPublicHearings().catch((error) => {
  console.error('Failed to seed publicHearings:', error?.message || error)
  process.exit(1)
})
