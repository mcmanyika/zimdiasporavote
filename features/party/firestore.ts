import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type {
  PartyEvent,
  PartyLeadershipNomination,
  PartyNominationStatus,
  PartyLeadershipVote,
  PartyLeadershipVotingConfig,
  PartyPositionType,
  PartyInterestStatus,
  PartyInterestSubmission,
  PartyLandingContent,
} from './types'

function requireDb() {
  if (!db) {
    throw new Error('Firestore not initialized')
  }
  return db
}

function toDate(value: any): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (value?.toDate) return value.toDate()
  return new Date(value)
}

export async function getPartyLandingContent(): Promise<PartyLandingContent | null> {
  const database = requireDb()
  try {
    const snap = await getDoc(doc(database, 'partyContent', 'landing'))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      ...data,
      id: snap.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PartyLandingContent
  } catch (error) {
    console.error('Error fetching party landing content:', error)
    return null
  }
}

export async function upsertPartyLandingContent(
  payload: Omit<PartyLandingContent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<void> {
  const database = requireDb()
  const ref = doc(database, 'partyContent', 'landing')
  const now = Timestamp.now()

  const data: Record<string, any> = {
    id: 'landing',
    pageTitle: payload.pageTitle,
    heroTitle: payload.heroTitle,
    heroSubtitle: payload.heroSubtitle,
    foundingStatement: payload.foundingStatement,
    mission: payload.mission,
    vision: payload.vision,
    principles: Array.isArray(payload.principles) ? payload.principles : [],
    isPublished: payload.isPublished,
    updatedAt: now,
  }

  if (payload.heroStats !== undefined) data.heroStats = payload.heroStats
  if (payload.callToActionText !== undefined) data.callToActionText = payload.callToActionText
  if (payload.updatedBy !== undefined) data.updatedBy = payload.updatedBy

  const existing = await getDoc(ref)
  if (!existing.exists()) {
    data.createdAt = now
  }

  await setDoc(ref, data, { merge: true })
}

export async function getPartyEvents(publishedOnly: boolean = true): Promise<PartyEvent[]> {
  const database = requireDb()

  const normalize = (snapshot: any): PartyEvent[] =>
    snapshot.docs
      .map((docSnap: any) => {
        const data = docSnap.data()
        return {
          ...data,
          id: docSnap.id,
          eventDate: toDate(data.eventDate),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as PartyEvent
      })
      .filter((event: PartyEvent) => (publishedOnly ? event.isPublished : true))
      .sort((a: PartyEvent, b: PartyEvent) => {
        const aTime = new Date(a.eventDate as any).getTime()
        const bTime = new Date(b.eventDate as any).getTime()
        return aTime - bTime
      })

  try {
    const q = publishedOnly
      ? query(collection(database, 'partyEvents'), where('isPublished', '==', true))
      : query(collection(database, 'partyEvents'))
    const snapshot = await getDocs(q)
    return normalize(snapshot)
  } catch (error) {
    console.warn('Error fetching party events (fallback to full scan):', error)
    try {
      const snapshot = await getDocs(collection(database, 'partyEvents'))
      return normalize(snapshot)
    } catch (fallbackError) {
      console.error('Error fetching party events fallback:', fallbackError)
      return []
    }
  }
}

export async function createPartyEvent(
  payload: Omit<PartyEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const database = requireDb()
  const ref = doc(collection(database, 'partyEvents'))
  const now = Timestamp.now()
  const data: Record<string, any> = {
    id: ref.id,
    title: payload.title,
    province: payload.province,
    location: payload.location,
    eventDate: payload.eventDate,
    isPublished: payload.isPublished,
    createdAt: now,
    updatedAt: now,
  }
  if (payload.description !== undefined) data.description = payload.description
  if (payload.startTime !== undefined) data.startTime = payload.startTime
  if (payload.endTime !== undefined) data.endTime = payload.endTime
  if (payload.registrationUrl !== undefined) data.registrationUrl = payload.registrationUrl
  if (payload.createdBy !== undefined) data.createdBy = payload.createdBy
  await setDoc(ref, data)
  return ref.id
}

export async function updatePartyEvent(
  id: string,
  patch: Partial<Omit<PartyEvent, 'id' | 'createdAt'>>
): Promise<void> {
  const database = requireDb()
  const updateData: Record<string, any> = { updatedAt: Timestamp.now() }
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value
  })
  await updateDoc(doc(database, 'partyEvents', id), updateData)
}

export async function deletePartyEvent(id: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'partyEvents', id))
}

export async function createPartyInterestSubmission(
  payload: Omit<PartyInterestSubmission, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const database = requireDb()
  const ref = doc(collection(database, 'partyInterestSubmissions'))
  const now = Timestamp.now()
  const data: Record<string, any> = {
    id: ref.id,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    province: payload.province,
    roleInterest: payload.roleInterest,
    message: payload.message,
    status: 'new' as PartyInterestStatus,
    createdAt: now,
    updatedAt: now,
  }
  if (payload.district !== undefined) data.district = payload.district
  await setDoc(ref, data)
  return ref.id
}

export async function getPartyInterestSubmissions(): Promise<PartyInterestSubmission[]> {
  const database = requireDb()
  const normalize = (snapshot: any): PartyInterestSubmission[] =>
    snapshot.docs
      .map((docSnap: any) => {
        const data = docSnap.data()
        return {
          ...data,
          id: docSnap.id,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as PartyInterestSubmission
      })
      .sort((a: PartyInterestSubmission, b: PartyInterestSubmission) => {
        const aTime = new Date(a.createdAt as any).getTime()
        const bTime = new Date(b.createdAt as any).getTime()
        return bTime - aTime
      })

  try {
    const snapshot = await getDocs(
      query(collection(database, 'partyInterestSubmissions'), orderBy('createdAt', 'desc'))
    )
    return normalize(snapshot)
  } catch (error) {
    console.warn('Error fetching party interest submissions (fallback to full scan):', error)
    try {
      const snapshot = await getDocs(collection(database, 'partyInterestSubmissions'))
      return normalize(snapshot)
    } catch (fallbackError) {
      console.error('Error fetching party interest submissions fallback:', fallbackError)
      return []
    }
  }
}

export async function updatePartyInterestSubmission(
  id: string,
  patch: Partial<Omit<PartyInterestSubmission, 'id' | 'createdAt'>>
): Promise<void> {
  const database = requireDb()
  const updateData: Record<string, any> = { updatedAt: Timestamp.now() }
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value
  })
  await updateDoc(doc(database, 'partyInterestSubmissions', id), updateData)
}

const PARTY_VOTING_CONFIG_ID = 'current'
const DEFAULT_PARTY_VOTING_CONFIG: Omit<PartyLeadershipVotingConfig, 'updatedAt'> = {
  id: PARTY_VOTING_CONFIG_ID,
  electionCycle: '2026-primary',
  nominationsOpen: true,
  votingOpen: true,
  maxVotesPerPosition: 1,
}

export async function getPartyLeadershipVotingConfig(): Promise<PartyLeadershipVotingConfig> {
  const database = requireDb()
  try {
    const ref = doc(database, 'partyLeadershipVotingConfig', PARTY_VOTING_CONFIG_ID)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      return {
        ...DEFAULT_PARTY_VOTING_CONFIG,
        updatedAt: new Date(),
      }
    }
    const data = snap.data()
    return {
      ...DEFAULT_PARTY_VOTING_CONFIG,
      ...data,
      id: snap.id,
      updatedAt: toDate(data.updatedAt),
    } as PartyLeadershipVotingConfig
  } catch (error) {
    console.error('Error loading party voting config:', error)
    return {
      ...DEFAULT_PARTY_VOTING_CONFIG,
      updatedAt: new Date(),
    }
  }
}

export async function upsertPartyLeadershipVotingConfig(
  patch: Partial<Omit<PartyLeadershipVotingConfig, 'id' | 'updatedAt'>>
): Promise<void> {
  const database = requireDb()
  const ref = doc(database, 'partyLeadershipVotingConfig', PARTY_VOTING_CONFIG_ID)
  const payload: Record<string, any> = {
    ...patch,
    id: PARTY_VOTING_CONFIG_ID,
    updatedAt: Timestamp.now(),
  }
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key]
  })
  await setDoc(ref, payload, { merge: true })
}

export async function createPartyLeadershipNomination(
  payload: Omit<
    PartyLeadershipNomination,
    'id' | 'status' | 'votesCount' | 'createdAt' | 'updatedAt'
  >
): Promise<string> {
  const database = requireDb()
  const config = await getPartyLeadershipVotingConfig()
  if (!config.nominationsOpen) {
    throw new Error('Nominations are currently closed.')
  }

  const ref = doc(collection(database, 'partyLeadershipNominations'))
  const now = Timestamp.now()
  await setDoc(ref, {
    id: ref.id,
    electionCycle: payload.electionCycle || config.electionCycle,
    submittedByUserId: payload.submittedByUserId,
    submittedByName: payload.submittedByName,
    submittedByEmail: payload.submittedByEmail,
    submittedByPhone: payload.submittedByPhone || null,
    positionType: payload.positionType,
    nominationType: payload.nominationType,
    nomineeName: payload.nomineeName,
    nomineeEmail: payload.nomineeEmail || null,
    nomineePhone: payload.nomineePhone || null,
    province: payload.province,
    areaLabel: payload.areaLabel,
    motivation: payload.motivation,
    status: 'submitted',
    votesCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function getPartyLeadershipNominations(options?: {
  electionCycle?: string
  positionType?: PartyPositionType
  status?: PartyNominationStatus
  submittedByUserId?: string
}): Promise<PartyLeadershipNomination[]> {
  const database = requireDb()
  const q = query(collection(database, 'partyLeadershipNominations'))
  const snap = await getDocs(q)
  const data = snap.docs
    .map((docSnap) => {
      const item = docSnap.data()
      return {
        ...item,
        id: docSnap.id,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      } as PartyLeadershipNomination
    })
    .filter((item) => {
      if (options?.electionCycle && item.electionCycle !== options.electionCycle) return false
      if (options?.positionType && item.positionType !== options.positionType) return false
      if (options?.status && item.status !== options.status) return false
      if (options?.submittedByUserId && item.submittedByUserId !== options.submittedByUserId) return false
      return true
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
    )
  return data
}

export async function updatePartyLeadershipNomination(
  id: string,
  patch: Partial<Omit<PartyLeadershipNomination, 'id' | 'createdAt' | 'submittedByUserId'>>
): Promise<void> {
  const database = requireDb()
  const updateData: Record<string, any> = { updatedAt: Timestamp.now() }
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) updateData[key] = value
  })
  await updateDoc(doc(database, 'partyLeadershipNominations', id), updateData)
}

export async function getPartyLeadershipVotesByUser(
  voterUserId: string,
  electionCycle: string
): Promise<PartyLeadershipVote[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'partyLeadershipVotes'),
    where('voterUserId', '==', voterUserId),
    where('electionCycle', '==', electionCycle),
    orderBy('createdAt', 'desc')
  )
  try {
    const snap = await getDocs(q)
    return snap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
      } as PartyLeadershipVote
    })
  } catch (error) {
    console.warn('Index unavailable for leadership votes query, using fallback:', error)
    const fallback = await getDocs(collection(database, 'partyLeadershipVotes'))
    return fallback.docs
      .map((docSnap) => {
        const data = docSnap.data()
        return {
          ...data,
          id: docSnap.id,
          createdAt: toDate(data.createdAt),
        } as PartyLeadershipVote
      })
      .filter((vote) => vote.voterUserId === voterUserId && vote.electionCycle === electionCycle)
      .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
  }
}

export async function togglePartyLeadershipVote(input: {
  nominationId: string
  voterUserId: string
}): Promise<{ voted: boolean }> {
  const database = requireDb()
  const config = await getPartyLeadershipVotingConfig()
  if (!config.votingOpen) {
    throw new Error('Voting is currently closed.')
  }

  const nominationRef = doc(database, 'partyLeadershipNominations', input.nominationId)
  const nominationSnap = await getDoc(nominationRef)
  if (!nominationSnap.exists()) throw new Error('Nomination not found.')

  const nomination = nominationSnap.data() as PartyLeadershipNomination
  if (nomination.status !== 'approved_for_voting') {
    throw new Error('This nomination is not open for voting.')
  }

  const voteId = `${config.electionCycle}_${input.nominationId}_${input.voterUserId}`
  const voteRef = doc(database, 'partyLeadershipVotes', voteId)
  const existingVote = await getDoc(voteRef)

  if (existingVote.exists()) {
    const currentVotesCount = Number(nomination.votesCount || 0)
    await deleteDoc(voteRef)
    await updateDoc(nominationRef, {
      votesCount: currentVotesCount > 0 ? currentVotesCount - 1 : 0,
      updatedAt: Timestamp.now(),
    })
    return { voted: false }
  }

  const currentVotes = await getPartyLeadershipVotesByUser(input.voterUserId, config.electionCycle)
  const votesForPosition = currentVotes.filter((vote) => vote.positionType === nomination.positionType).length
  if (votesForPosition >= config.maxVotesPerPosition) {
    throw new Error(`You can vote for up to ${config.maxVotesPerPosition} candidate(s) per position.`)
  }

  const currentVotesCount = Number(nomination.votesCount || 0)
  await setDoc(voteRef, {
    id: voteId,
    nominationId: input.nominationId,
    electionCycle: config.electionCycle,
    positionType: nomination.positionType,
    voterUserId: input.voterUserId,
    createdAt: Timestamp.now(),
  })
  await updateDoc(nominationRef, {
    votesCount: currentVotesCount + 1,
    updatedAt: Timestamp.now(),
  })
  return { voted: true }
}
