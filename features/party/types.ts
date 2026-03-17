import type { Timestamp } from 'firebase/firestore'

export interface PartyHeroStat {
  label: string
  value: string
}

export interface PartyLandingContent {
  id: string
  pageTitle: string
  heroTitle: string
  heroSubtitle: string
  foundingStatement: string
  mission: string
  vision: string
  principles: string[]
  heroStats?: PartyHeroStat[]
  callToActionText?: string
  isPublished: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  updatedBy?: string
}

export interface PartyEvent {
  id: string
  title: string
  description?: string
  province: string
  location: string
  eventDate: Timestamp | Date
  startTime?: string
  endTime?: string
  registrationUrl?: string
  isPublished: boolean
  createdBy?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type PartyInterestStatus = 'new' | 'contacted' | 'converted' | 'archived'

export interface PartyInterestSubmission {
  id: string
  fullName: string
  email: string
  phone: string
  province: string
  district?: string
  roleInterest: string
  message: string
  status: PartyInterestStatus
  reviewedBy?: string
  reviewNotes?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type PartyPositionType = 'council' | 'mp' | 'senator'
export type PartyNominationType = 'self' | 'other'
export type PartyNominationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved_for_voting'
  | 'rejected'
  | 'shortlisted'
  | 'final_selected'
  | 'withdrawn'

export interface PartyLeadershipNomination {
  id: string
  electionCycle: string
  submittedByUserId: string
  submittedByName: string
  submittedByEmail: string
  submittedByPhone?: string
  positionType: PartyPositionType
  nominationType: PartyNominationType
  nomineeName: string
  nomineeEmail?: string
  nomineePhone?: string
  province: string
  areaLabel: string
  motivation: string
  status: PartyNominationStatus
  votesCount: number
  reviewNotes?: string
  reviewedBy?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface PartyLeadershipVote {
  id: string
  electionCycle: string
  nominationId: string
  positionType: PartyPositionType
  voterUserId: string
  createdAt: Timestamp | Date
}

export interface PartyLeadershipVotingConfig {
  id: string
  electionCycle: string
  nominationsOpen: boolean
  votingOpen: boolean
  maxVotesPerPosition: number
  updatedBy?: string
  updatedAt: Timestamp | Date
}
