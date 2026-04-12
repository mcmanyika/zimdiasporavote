import { Timestamp } from 'firebase/firestore'
import type { ViolenceInstigatorCategory } from '@/lib/violence-instigator-submissions'

export type UserRole = 'supporter' | 'member' | 'moderator' | 'admin'
export type MembershipTier = 'free' | 'basic' | 'premium' | 'champion'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled'
export type PaymentMethod = 'stripe' | 'cash' | 'bank_transfer' | 'mobile_money'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
export type ShipmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface UserProfile {
  uid: string
  email: string
  name?: string
  phone?: string
  address?: string
  membershipTier: MembershipTier
  role: UserRole
  createdAt: Timestamp | Date
  emailVerified: boolean
  stripeCustomerId?: string
  photoURL?: string
  referralCode?: string       // unique short code, e.g. "DCP-A7K3X"
  referredBy?: string         // referral code of the user who referred this user
  accessLevel?: number        // admin-assigned access level 1-5
}

export interface Donation {
  id: string
  userId: string
  amount: number
  currency: string
  status: PaymentStatus
  stripePaymentIntentId: string
  createdAt: Timestamp | Date
  description?: string
}

export interface Membership {
  id: string
  userId: string
  tier: MembershipTier
  stripePaymentIntentId: string
  status: PaymentStatus
  createdAt: Timestamp | Date

  // Cash / manual payment fields
  paymentMethod?: PaymentMethod
  amount?: number
  currency?: string
  billingPeriod?: 'monthly' | 'yearly'
  planLabel?: string           // e.g. "Diaspora Citizens – Yearly"
  paidAt?: Timestamp | Date
  nextDueDate?: Timestamp | Date
  recordedBy?: string          // admin uid who recorded the payment
  notes?: string               // e.g. "Cash received at Harare office"
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  message: string
  createdAt: Timestamp | Date
  userId?: string
}

export interface Purchase {
  id: string
  userId: string
  productId: string
  productName: string
  amount: number
  currency: string
  status: PaymentStatus
  shipmentStatus?: ShipmentStatus
  trackingNumber?: string
  stripePaymentIntentId: string
  createdAt: Timestamp | Date
  updatedAt?: Timestamp | Date
  description?: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  stock: number
  lowStockThreshold: number
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type NewsCategory = 'announcement' | 'event' | 'update' | 'general'

export interface News {
  id: string
  title: string
  description: string
  content?: string
  image?: string
  author?: string
  category?: NewsCategory
  isPublished: boolean
  publishedAt?: Timestamp | Date
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type VideoCategory = 'constitution' | 'rights' | 'governance' | 'youth' | 'civic_education' | 'general'

export interface Video {
  id: string
  title: string
  description?: string
  youtubeUrl: string
  youtubeVideoId: string
  thumbnailUrl?: string
  category: VideoCategory
  tags?: string[]
  durationLabel?: string
  isPublished: boolean
  isFeatured: boolean
  order: number
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export type VolunteerApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export interface VolunteerApplication {
  id: string
  userId: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  dateOfBirth?: string
  gender?: string
  availability: string
  skills: string[]
  experience: string
  motivation: string
  references?: string
  status: VolunteerApplicationStatus
  notes?: string
  reviewedBy?: string
  reviewedAt?: Timestamp | Date
  emailedAt?: Timestamp | Date
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface PetitionSignature {
  userId?: string
  name: string
  email: string
  signedAt: Timestamp | Date
  anonymous?: boolean
}

export interface Petition {
  id: string
  title: string
  description: string
  content?: string
  image?: string
  goal: number
  currentSignatures: number
  signatures: PetitionSignature[]
  isActive: boolean
  isPublished: boolean
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  publishedAt?: Timestamp | Date
  expiresAt?: Timestamp | Date
}

export interface NewsletterSubscription {
  id: string
  email: string
  userId?: string
  subscribed: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Banner {
  id: string
  imageUrl: string
  title?: string
  subtitle?: string
  description?: string
  isActive: boolean
  order: number
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface GalleryCategory {
  id: string
  name: string
  slug: string
  description?: string
  coverImage?: string
  order: number
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface GalleryImage {
  id: string
  imageUrl: string
  title?: string
  description?: string
  categoryId: string
  categoryName: string
  isPublished: boolean
  order: number
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Survey types
export type SurveyStatus = 'draft' | 'active' | 'closed'
export type SurveyCategory = 'governance' | 'rights' | 'community' | 'policy' | 'general'
export type SurveyQuestionType = 'multiple_choice' | 'checkbox' | 'rating' | 'short_text' | 'long_text' | 'yes_no'

export interface SurveyQuestion {
  id: string
  type: SurveyQuestionType
  text: string
  description?: string
  required: boolean
  order: number
  options?: string[]         // For multiple_choice, checkbox
  minRating?: number         // For rating (default 1)
  maxRating?: number         // For rating (default 5)
}

export interface Survey {
  id: string
  title: string
  description: string
  category: SurveyCategory
  status: SurveyStatus
  isPublic: boolean          // Can non-authenticated users respond?
  allowAnonymous: boolean    // Can users submit without identity?
  showResults: boolean       // Are results publicly visible?
  responseGoal?: number      // Target number of responses
  responseCount: number
  deadline?: Timestamp | Date
  questions: SurveyQuestion[]
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface SurveyAnswer {
  questionId: string
  value: string | string[] | number
}

export interface SurveyResponse {
  id: string
  surveyId: string
  userId?: string
  isAnonymous: boolean
  answers: SurveyAnswer[]
  submittedAt: Timestamp | Date
}

// Membership Application types
export type MembershipApplicationType = 'individual' | 'institutional'
export type MembershipApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'
export type OrganisationType = 'civic' | 'labour' | 'faith' | 'student_youth' | 'professional' | 'community_residents' | 'liberation_veterans' | 'other'
export type ParticipationArea = 'civic_education' | 'legal_constitutional' | 'parliamentary' | 'community_mobilisation' | 'research_policy' | 'communications_media' | 'other'

export interface MembershipApplication {
  id: string
  type: MembershipApplicationType
  status: MembershipApplicationStatus
  userId?: string

  // Section B: Individual Details
  fullName?: string
  nationalIdPassport?: string
  gender?: string
  dateOfBirth?: string
  province?: string
  district?: string
  occupation?: string
  mobileNumber?: string
  emailAddress?: string
  participationAreas?: ParticipationArea[]
  participationOther?: string

  // Section C: Institutional Details
  organisationName?: string
  organisationType?: OrganisationType
  organisationTypeOther?: string
  registrationStatus?: string
  physicalAddress?: string
  provincesOfOperation?: string
  representativeName?: string
  representativePosition?: string
  representativeMobile?: string
  representativeEmail?: string
  alternateRepresentative?: string

  // Section D: Declaration
  declarationAccepted: boolean
  signatureName?: string
  signatureDate?: string

  // Section E: Official Use Only
  membershipNumber?: string
  provinceAllocated?: string
  dateReceived?: string
  approvedBy?: string
  reviewNotes?: string

  emailedAt?: Timestamp | Date

  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Youth module types
export type YouthAgeBand = 'under_18' | '18_21' | '22_25' | '26_30' | '31_plus'
export type YouthMissionCategory = 'civic_education' | 'mobilization' | 'digital_advocacy' | 'community_service' | 'leadership'
export type YouthMissionSubmissionStatus = 'submitted' | 'approved' | 'rejected'

export interface YouthProfile {
  userId: string
  ageBand: YouthAgeBand
  province: string
  district?: string
  institution?: string
  interests: string[]
  goals?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface YouthMission {
  id: string
  title: string
  description: string
  category: YouthMissionCategory
  points: number
  estimatedMinutes: number
  isActive: boolean
  dueDate?: Timestamp | Date
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface YouthMissionSubmission {
  id: string
  missionId: string
  userId: string
  notes?: string
  proofUrl?: string
  status: YouthMissionSubmissionStatus
  submittedAt: Timestamp | Date
  reviewedAt?: Timestamp | Date
  reviewedBy?: string
}

// Admin Notification types
export type NotificationType =
  | 'new_user'
  | 'new_purchase'
  | 'new_donation'
  | 'new_membership_application'
  | 'new_contact'
  | 'new_volunteer'
  | 'new_article'
  | 'new_petition'
  | 'purchase_status_update'

export type NotificationAudience = 'admin' | 'all' | 'user'

export interface AdminNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string
  read: boolean               // legacy admin-only flag
  readBy: string[]             // per-user read tracking (userIds)
  audience: NotificationAudience  // who can see this notification
  userId?: string              // target user (when audience === 'user')
  createdAt: Timestamp | Date
}

// Email Log types
export type EmailType = 'welcome' | 'membership_approved' | 'membership_rejected' | 'general' | 'custom'
export type EmailStatus = 'sent' | 'failed'
export type EmailSuppressionReason = 'unsubscribe' | 'admin_block' | 'hard_bounce' | 'complaint'

export interface EmailLog {
  id: string
  type: EmailType
  to: string
  name: string
  subject: string
  status: EmailStatus
  resendId?: string        // ID returned by Resend
  error?: string           // Error message if failed
  userId?: string          // Associated user ID if available
  createdAt: Timestamp | Date
}

export interface EmailSuppression {
  id: string
  email: string
  active: boolean
  reason: EmailSuppressionReason
  source: 'admin' | 'self_service' | 'provider_webhook'
  note?: string
  createdBy?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Inbound Email (received via Resend webhook)
export interface InboundEmail {
  id: string
  from: string
  fromName?: string
  to: string
  subject: string
  body: string           // plain text body
  html?: string          // HTML body
  isRead: boolean
  isStarred: boolean
  resendEmailId?: string
  createdAt: Timestamp | Date
}

// Bill Proposal module
export type BillProposalStatus =
  | 'draft'
  | 'under_review'
  | 'needs_revision'
  | 'published_for_consultation'
  | 'archived'

export interface BillProposal {
  id: string
  title: string
  summary: string
  problem: string
  solution: string
  legalBasis?: string
  category: string
  proposerName: string
  proposerEmail: string
  proposerUserId?: string
  status: BillProposalStatus
  supportCount: number
  publishedAt?: Timestamp | Date
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface BillProposalSupport {
  id: string
  proposalId: string
  email?: string
  userId?: string
  createdAt: Timestamp | Date
}

// Leadership types
export interface Leader {
  id: string
  name: string
  title: string
  bio: string
  imageUrl?: string
  xHandle?: string
  order: number
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Organization {
  id: string
  name: string
  acronym?: string
  order: number
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type SiteLinkSection =
  | 'header'
  | 'footer_quick'
  | 'footer_more'
  | 'footer_useful'
  | 'footer_social'
  | 'footer_app'

export interface SiteLink {
  id: string
  label: string
  url: string
  section: SiteLinkSection
  order: number
  isActive: boolean
  openInNewTab?: boolean
  style?: 'link' | 'button'
  iconKey?: string
  description?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface CountryPhoneCode {
  id: string
  iso2: string
  name: string
  dialCode: string
  order: number
  isActive: boolean
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type PublicHearingStatus = 'upcoming' | 'today' | 'completed' | 'cancelled' | 'rescheduled'

export interface PublicHearing {
  id: string
  title: string
  billCode?: string
  teamCode?: string
  province: string
  district: string
  locationName?: string
  venue: string
  scheduledDate: Timestamp | Date
  startTime?: string
  endTime?: string
  timezone?: string
  status: PublicHearingStatus
  isPublished: boolean
  sourceUrl?: string
  sourceImageUrl?: string
  notes?: string
  createdBy?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export type {
  PartyLandingContent,
  PartyEvent,
  PartyPositionType,
  PartyNominationType,
  PartyNominationStatus,
  PartyLeadershipNomination,
  PartyLeadershipVote,
  PartyLeadershipVotingConfig,
  PartyInterestStatus,
  PartyInterestSubmission,
} from '@/features/party/types'

// Referral types
export type ReferralStatus = 'signed_up' | 'applied' | 'paid'

export interface Referral {
  id: string
  referrerUserId: string     // who shared the link
  referredUserId: string     // who signed up
  referredEmail: string
  referredName: string
  status: ReferralStatus     // tracks progress through the funnel
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

export interface Resource {
  id: string
  title: string
  description?: string
  fileName: string
  fileUrl: string
  storagePath: string
  fileSize: number        // bytes
  uploadedBy: string      // user uid
  uploadedByName?: string
  createdAt: Timestamp | Date
}

export type IncidentReportStatus = 'new' | 'reviewing' | 'verified' | 'archived' | 'failed'

export interface IncidentReport {
  id: string
  source: 'whatsapp'
  reporterPhone: string
  messageId?: string
  whatsappMediaId?: string
  whatsappMediaUrl?: string
  mediaMimeType?: string
  mediaSha256?: string
  mediaFileSize?: number
  mediaUrl?: string
  storagePath?: string
  caption?: string
  description?: string
  status: IncidentReportStatus
  errorMessage?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Violence instigator — X/Twitter link intake (public submit, admin activates)
export type ViolenceInstigatorSubmissionStatus = 'pending' | 'active' | 'rejected'

export type { ViolenceInstigatorCategory } from '@/lib/violence-instigator-submissions'

export interface ViolenceInstigatorSubmission {
  id: string
  tweetUrl: string
  category: ViolenceInstigatorCategory
  status: ViolenceInstigatorSubmissionStatus
  reviewedBy?: string
  reviewNote?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Twitter Embeds
export interface TwitterEmbedPost {
  id: string
  tweetUrl: string          // full URL, e.g. https://twitter.com/MacBelts/status/123
  label?: string            // optional admin-facing note / label
  isActive: boolean         // only the active one is shown on the site
  createdBy: string         // admin uid
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Email Drafts
export type EmailDraftContext = 'volunteer' | 'membership' | 'contact'

export interface EmailDraft {
  id: string
  context: EmailDraftContext
  targetId: string           // e.g. application ID
  recipientEmail: string
  recipientName: string
  subject: string
  body: string
  createdBy: string          // admin uid
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

// Ensure this file is treated as a module
export { }

