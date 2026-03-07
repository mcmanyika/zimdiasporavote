import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  arrayUnion,
  increment,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile, Donation, Membership, ContactSubmission, Purchase, Product, UserRole, News, Video, CartItem, VolunteerApplication, VolunteerApplicationStatus, Petition, PetitionSignature, ShipmentStatus, NewsletterSubscription, Banner, GalleryCategory, GalleryImage, Survey, SurveyResponse, MembershipApplication, MembershipApplicationStatus, AdminNotification, NotificationType, NotificationAudience, EmailLog, EmailType, EmailStatus, Leader, Organization, IncidentReport, Referral, ReferralStatus, Resource, EmailDraft, EmailDraftContext, TwitterEmbedPost, InboundEmail, PaymentMethod, YouthProfile, YouthMission, YouthMissionSubmission } from '@/types'

// Helper functions
function requireDb() {
  if (!db) throw new Error('Firebase Firestore is not initialized')
  return db
}

function toDate(timestamp: any): Date {
  return timestamp?.toDate?.() || new Date()
}

// User operations
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(requireDb(), 'users', userId))
  if (!userDoc.exists()) return null

  const data = userDoc.data()
  return { ...data, createdAt: toDate(data.createdAt) } as UserProfile
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  await setDoc(doc(requireDb(), 'users', userId), data, { merge: true })
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(requireDb(), 'users'))
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return { ...data, uid: doc.id, createdAt: toDate(data.createdAt) } as UserProfile
  })
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  await setDoc(doc(requireDb(), 'users', userId), { role }, { merge: true })
}

export async function updateUserAccessLevel(userId: string, accessLevel: number): Promise<void> {
  const level = Math.min(5, Math.max(1, Math.round(accessLevel)))
  await setDoc(doc(requireDb(), 'users', userId), { accessLevel: level }, { merge: true })
}

export async function createStripeCustomerId(
  userId: string,
  customerId: string
): Promise<void> {
  await setDoc(doc(requireDb(), 'users', userId), { stripeCustomerId: customerId }, { merge: true })
}

// Donation operations
export async function createDonation(donation: Omit<Donation, 'id' | 'createdAt'>): Promise<string> {
  const db = requireDb()
  // Idempotency guard: avoid duplicate donation rows for the same Stripe payment intent.
  const existingDonationQuery = query(
    collection(db, 'donations'),
    where('stripePaymentIntentId', '==', donation.stripePaymentIntentId),
    limit(1)
  )
  const existingDonationSnapshot = await getDocs(existingDonationQuery)
  if (!existingDonationSnapshot.empty) {
    const existingId = existingDonationSnapshot.docs[0].id
    console.log('Donation already exists for payment intent:', donation.stripePaymentIntentId, existingId)
    return existingId
  }

  const donationRef = doc(collection(db, 'donations'))
  try {
    // Ensure all required fields are present and valid
    const donationData = {
      userId: donation.userId || '',
      amount: donation.amount,
      currency: donation.currency || 'usd',
      status: donation.status,
      stripePaymentIntentId: donation.stripePaymentIntentId,
      description: donation.description || null, // Use null instead of undefined for Firestore
      id: donationRef.id,
      createdAt: Timestamp.now(),
    }

    await setDoc(donationRef, donationData)
    console.log('Donation created successfully:', donationRef.id, donationData)
    return donationRef.id
  } catch (error: any) {
    console.error('Error in createDonation:', {
      error,
      code: error?.code,
      message: error?.message,
      donation,
      firestoreError: error?.code === 'permission-denied' ? 'Check Firestore rules' : undefined,
    })
    throw error
  }
}

export async function getDonationsByUser(userId: string): Promise<Donation[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  const mapDocs = (snapshot: any): Donation[] => {
    const donations = snapshot.docs.map((d: any) => ({
      ...d.data(),
      id: d.id, // always use Firestore doc ID
      createdAt: toDate(d.data().createdAt),
    })) as Donation[]

    // Sort by createdAt descending
    donations.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime()
      return dateB - dateA
    })

    return donations
  }

  // Strategy 1: Query with orderBy (requires composite index)
  try {
    const q = query(
      collection(db, 'donations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    const snapshot = await getDocs(q)
    console.log(`Found ${snapshot.docs.length} donations for user ${userId} (indexed query)`)
    return mapDocs(snapshot)
  } catch (error: any) {
    console.warn('Donations indexed query failed:', error?.code, error?.message)
  }

  // Strategy 2: Query without orderBy (no composite index needed)
  try {
    const q = query(
      collection(db, 'donations'),
      where('userId', '==', userId),
      limit(50)
    )
    const snapshot = await getDocs(q)
    console.log(`Found ${snapshot.docs.length} donations for user ${userId} (simple query)`)
    return mapDocs(snapshot)
  } catch (error: any) {
    console.warn('Donations simple query failed:', error?.code, error?.message)
  }

  // Strategy 3: Fetch ALL donations and filter client-side (last resort, admin-only fallback)
  try {
    const snapshot = await getDocs(collection(db, 'donations'))
    const allDonations = mapDocs(snapshot)
    const userDonations = allDonations.filter(d => d.userId === userId)
    console.log(`Found ${userDonations.length} donations for user ${userId} (full scan fallback)`)
    return userDonations
  } catch (error: any) {
    console.error('All donation query strategies failed:', error?.code, error?.message)
    return []
  }
}

export async function getDonationById(donationId: string): Promise<Donation | null> {
  const donationDoc = await getDoc(doc(requireDb(), 'donations', donationId))
  if (!donationDoc.exists()) return null

  const data = donationDoc.data()
  return { ...data, createdAt: toDate(data.createdAt) } as Donation
}

export async function updateDonationStatus(
  donationId: string,
  status: Donation['status']
): Promise<void> {
  await updateDoc(doc(requireDb(), 'donations', donationId), { status })
}

export async function getAllDonations(): Promise<Donation[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(
      collection(db, 'donations'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      createdAt: toDate(d.data().createdAt),
    })) as Donation[]
  } catch (error: any) {
    console.warn('getAllDonations ordered query failed:', error?.code, error?.message)
    // Fallback without orderBy
    try {
      const snapshot = await getDocs(collection(db, 'donations'))
      const donations = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: toDate(d.data().createdAt),
      })) as Donation[]
      return donations.sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return bDate - aDate
      })
    } catch (fallbackError: any) {
      console.error('getAllDonations fallback failed:', fallbackError?.code, fallbackError?.message)
      return []
    }
  }
}

// Membership operations
export async function getAllMemberships(): Promise<Membership[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(collection(db, 'memberships'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
      } as Membership
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(collection(db, 'memberships'))
        const memberships = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
          } as Membership
        })
        return memberships.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback memberships query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching all memberships:', error)
    return []
  }
}

export async function createMembership(
  membership: Omit<Membership, 'id' | 'createdAt'>
): Promise<string> {
  const db = requireDb()
  const membershipRef = doc(collection(db, 'memberships'))

  try {
    // createdAt is automatically set to now
    const membershipData = {
      ...membership,
      id: membershipRef.id,
      createdAt: Timestamp.now(),
    }

    await setDoc(membershipRef, membershipData)
    console.log('Membership created successfully:', membershipRef.id, membershipData)
    return membershipRef.id
  } catch (error: any) {
    console.error('Error in createMembership:', {
      error,
      code: error?.code,
      message: error?.message,
      membership,
      firestoreError: error?.code === 'permission-denied' ? 'Check Firestore rules' : undefined,
    })
    throw error
  }
}

export async function getMembershipByUser(userId: string): Promise<Membership | null> {
  if (!db) {
    console.warn('Firestore not initialized')
    return null
  }

  try {
    // Try query with orderBy first (requires composite index)
    // Get the most recent succeeded membership
    const q = query(
      collection(db, 'memberships'),
      where('userId', '==', userId),
      where('status', '==', 'succeeded'),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      console.log(`No succeeded membership found for user ${userId}, trying without status filter`)
      // Fallback: get any membership (in case status filter index isn't ready)
      const fallbackQ = query(
        collection(db, 'memberships'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const fallbackSnapshot = await getDocs(fallbackQ)
      if (fallbackSnapshot.empty) {
        console.log(`No membership found for user ${userId}`)
        return null
      }
      const data = fallbackSnapshot.docs[0].data()
      const membership = {
        ...data,
        createdAt: toDate(data.createdAt),
      } as Membership
      console.log(`Found membership for user ${userId} (fallback):`, membership)
      return membership
    }

    const data = snapshot.docs[0].data()
    const membership = {
      ...data,
      createdAt: toDate(data.createdAt),
    } as Membership
    console.log(`Found succeeded membership for user ${userId}:`, membership)
    return membership
  } catch (error: any) {
    // If index error, try without orderBy
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn('Composite index not ready, trying query without orderBy:', error)
      try {
        const q = query(
          collection(db, 'memberships'),
          where('userId', '==', userId),
          limit(10) // Get more to filter client-side
        )
        const snapshot = await getDocs(q)
        if (snapshot.empty) {
          console.log(`No membership found for user ${userId} (without index)`)
          return null
        }

        // Sort manually and filter for succeeded status
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: toDate(doc.data().createdAt),
        })) as Membership[]

        // Filter for succeeded and sort by date
        const succeeded = docs.filter((m) => m.status === 'succeeded')
        const sorted = succeeded.length > 0 ? succeeded : docs
        sorted.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime()
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime()
          return dateB - dateA // Descending order
        })

        const membership = sorted[0]
        console.log(`Found membership for user ${userId} (manual sort):`, membership)
        return membership
      } catch (fallbackError: any) {
        console.error('Error in fallback membership query:', fallbackError)
        throw fallbackError
      }
    }

    console.error('Error in getMembershipByUser:', {
      error,
      code: error?.code,
      message: error?.message,
      userId,
    })
    throw error
  }
}

export async function getMembershipByPaymentIntentId(
  paymentIntentId: string
): Promise<Membership | null> {
  if (!db) return null

  const q = query(
    collection(db, 'memberships'),
    where('stripePaymentIntentId', '==', paymentIntentId),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const data = snapshot.docs[0].data()
  return {
    ...data,
    createdAt: toDate(data.createdAt),
  } as Membership
}

export async function updateMembership(
  membershipId: string,
  data: Partial<Membership>
): Promise<void> {
  const updateData: any = {}

  if (data.tier !== undefined) updateData.tier = data.tier
  if (data.status !== undefined) updateData.status = data.status
  if (data.stripePaymentIntentId !== undefined) updateData.stripePaymentIntentId = data.stripePaymentIntentId

  await updateDoc(doc(requireDb(), 'memberships', membershipId), updateData)
}

export async function updateMembershipStatus(
  paymentIntentId: string,
  status: Membership['status']
): Promise<void> {
  const membership = await getMembershipByPaymentIntentId(paymentIntentId)
  if (membership) {
    await updateMembership(membership.id, { status })
  }
}

// Cash / Manual Membership Payment
export async function createCashMembership(data: {
  userId: string
  tier: string
  amount: number
  billingPeriod: 'monthly' | 'yearly'
  paymentMethod: PaymentMethod
  planLabel: string
  recordedBy: string
  notes?: string
}): Promise<string> {
  const db = requireDb()
  const ref = doc(collection(db, 'memberships'))

  const now = new Date()
  const nextDue = new Date(now)
  if (data.billingPeriod === 'monthly') {
    nextDue.setMonth(nextDue.getMonth() + 1)
  } else {
    nextDue.setFullYear(nextDue.getFullYear() + 1)
  }

  await setDoc(ref, {
    id: ref.id,
    userId: data.userId,
    tier: data.tier,
    amount: data.amount,
    currency: 'USD',
    billingPeriod: data.billingPeriod,
    planLabel: data.planLabel,
    paymentMethod: data.paymentMethod,
    stripePaymentIntentId: `${data.paymentMethod}_${ref.id}`,
    status: 'succeeded',
    paidAt: Timestamp.now(),
    nextDueDate: Timestamp.fromDate(nextDue),
    recordedBy: data.recordedBy || 'admin',
    notes: data.notes || '',
    createdAt: Timestamp.now(),
  })

  return ref.id
}

export async function getMembershipsByUser(userId: string): Promise<Membership[]> {
  const db = requireDb()
  const mapDocs = (snapshot: any): Membership[] => snapshot.docs.map((d: any) => {
    const data = d.data()
    return {
      ...data,
      id: d.id,
      createdAt: toDate(data.createdAt),
      paidAt: data.paidAt ? toDate(data.paidAt) : undefined,
      nextDueDate: data.nextDueDate ? toDate(data.nextDueDate) : undefined,
    } as Membership
  })

  // Strategy 1: indexed query (preferred)
  try {
    const q = query(
      collection(db, 'memberships'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return mapDocs(snapshot)
  } catch (error: any) {
    console.warn('Memberships indexed query failed:', error?.code, error?.message)
  }

  // Strategy 2: simple query + manual sort (no composite index required)
  try {
    const q = query(
      collection(db, 'memberships'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    const memberships = mapDocs(snapshot)
    memberships.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime()
      return dateB - dateA
    })
    return memberships
  } catch (error: any) {
    console.error('Memberships simple query failed:', error?.code, error?.message)
    return []
  }
}

// Contact operations
export async function createContactSubmission(
  submission: Omit<ContactSubmission, 'id' | 'createdAt'>
): Promise<string> {
  const contactRef = doc(collection(requireDb(), 'contacts'))
  await setDoc(contactRef, {
    ...submission,
    id: contactRef.id,
    createdAt: Timestamp.now(),
  })
  return contactRef.id
}

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
      } as ContactSubmission
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      console.warn('Index not ready for contacts, using fallback')
      try {
        const snapshot = await getDocs(collection(db, 'contacts'))
        const submissions = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
          } as ContactSubmission
        })
        return submissions.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback contacts query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching contact submissions:', error)
    return []
  }
}

// Volunteer Application operations
export async function createVolunteerApplication(
  application: Omit<VolunteerApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const db = requireDb()
  const applicationRef = doc(collection(db, 'volunteers'))
  try {
    // Filter out undefined values - Firestore doesn't accept undefined
    const cleanApplication: any = {}
    Object.keys(application).forEach((key) => {
      const value = (application as any)[key]
      if (value !== undefined) {
        cleanApplication[key] = value
      }
    })

    const applicationData = {
      ...cleanApplication,
      status: 'pending' as VolunteerApplicationStatus,
      id: applicationRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(applicationRef, applicationData)
    console.log('Volunteer application created successfully:', applicationRef.id)
    return applicationRef.id
  } catch (error: any) {
    console.error('Error in createVolunteerApplication:', {
      error,
      code: error?.code,
      message: error?.message,
      application,
    })
    throw error
  }
}

export async function getVolunteerApplicationByUser(userId: string): Promise<VolunteerApplication | null> {
  if (!db) {
    console.warn('Firestore not initialized')
    return null
  }

  try {
    const q = query(
      collection(db, 'volunteers'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return null
    }

    const data = snapshot.docs[0].data()
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
    } as VolunteerApplication
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      // Fallback without orderBy
      try {
        const q = query(
          collection(db, 'volunteers'),
          where('userId', '==', userId),
          limit(1)
        )
        const snapshot = await getDocs(q)
        if (snapshot.empty) return null

        const data = snapshot.docs[0].data()
        return {
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
        } as VolunteerApplication
      } catch (fallbackError: any) {
        console.error('Error in fallback query:', fallbackError)
        throw fallbackError
      }
    }
    console.error('Error in getVolunteerApplicationByUser:', error)
    throw error
  }
}

export async function getAllVolunteerApplications(): Promise<VolunteerApplication[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(
      collection(db, 'volunteers'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
      } as VolunteerApplication
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      // Fallback without orderBy
      try {
        const q = query(collection(db, 'volunteers'))
        const snapshot = await getDocs(q)
        const applications = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
          } as VolunteerApplication
        })
        return applications.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback query:', fallbackError)
        throw fallbackError
      }
    }
    console.error('Error in getAllVolunteerApplications:', error)
    throw error
  }
}

export async function updateVolunteerApplicationStatus(
  applicationId: string,
  status: VolunteerApplicationStatus,
  reviewedBy: string,
  notes?: string
): Promise<void> {
  const db = requireDb()
  const updateData: any = {
    status,
    reviewedBy,
    reviewedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  if (notes) {
    updateData.notes = notes
  }
  await updateDoc(doc(db, 'volunteers', applicationId), updateData)
}

export async function markVolunteerEmailed(applicationId: string): Promise<void> {
  const db = requireDb()
  await updateDoc(doc(db, 'volunteers', applicationId), {
    emailedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function markMembershipApplicationEmailed(applicationId: string): Promise<void> {
  const db = requireDb()
  await updateDoc(doc(db, 'membershipApplications', applicationId), {
    emailedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function markMembershipApplicationsEmailedBatch(applicationIds: string[]): Promise<void> {
  const database = requireDb()
  const batch = writeBatch(database)
  const now = Timestamp.now()
  applicationIds.forEach((id) => {
    batch.update(doc(database, 'membershipApplications', id), {
      emailedAt: now,
      updatedAt: now,
    })
  })
  await batch.commit()
}

export async function markVolunteersEmailedBatch(applicationIds: string[]): Promise<void> {
  const database = requireDb()
  const batch = writeBatch(database)
  const now = Timestamp.now()
  applicationIds.forEach((id) => {
    batch.update(doc(database, 'volunteers', id), {
      emailedAt: now,
      updatedAt: now,
    })
  })
  await batch.commit()
}

// Email Draft operations
export async function saveEmailDraft(draft: {
  context: EmailDraftContext
  targetId: string
  recipientEmail: string
  recipientName: string
  subject: string
  body: string
  createdBy: string
}): Promise<string> {
  const database = requireDb()
  // Use a deterministic ID so we upsert per context+target
  const draftId = `${draft.context}_${draft.targetId}`
  const ref = doc(database, 'emailDrafts', draftId)
  await setDoc(ref, {
    ...draft,
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  }, { merge: true })
  return draftId
}

export async function getEmailDraft(context: EmailDraftContext, targetId: string): Promise<EmailDraft | null> {
  const database = requireDb()
  const draftId = `${context}_${targetId}`
  const snap = await getDoc(doc(database, 'emailDrafts', draftId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as EmailDraft
}

export async function deleteEmailDraft(context: EmailDraftContext, targetId: string): Promise<void> {
  const database = requireDb()
  const draftId = `${context}_${targetId}`
  await deleteDoc(doc(database, 'emailDrafts', draftId))
}

// Purchase operations
export async function createPurchase(purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = requireDb()
  const purchaseRef = doc(collection(db, 'purchases'))
  try {
    const purchaseData = {
      userId: purchase.userId || '',
      productId: purchase.productId,
      productName: purchase.productName,
      amount: purchase.amount,
      currency: purchase.currency || 'usd',
      status: purchase.status,
      shipmentStatus: purchase.shipmentStatus || 'pending',
      trackingNumber: purchase.trackingNumber || null,
      stripePaymentIntentId: purchase.stripePaymentIntentId,
      description: purchase.description || null,
      id: purchaseRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(purchaseRef, purchaseData)
    console.log('Purchase created successfully:', purchaseRef.id, purchaseData)
    return purchaseRef.id
  } catch (error: any) {
    console.error('Error in createPurchase:', {
      error,
      code: error?.code,
      message: error?.message,
      purchase,
      firestoreError: error?.code === 'permission-denied' ? 'Check Firestore rules' : undefined,
    })
    throw error
  }
}

export async function getPurchasesByUser(userId: string): Promise<Purchase[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    // Try composite index query first
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        createdAt: toDate(data.createdAt),
      } as Purchase
    })
  } catch (error: any) {
    // Fallback if composite index is not ready
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready, using fallback query')
      try {
        const q = query(
          collection(db, 'purchases'),
          where('userId', '==', userId)
        )
        const snapshot = await getDocs(q)
        const purchases = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            id: doc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
          } as Purchase
        })
        // Sort in memory
        return purchases.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback query:', fallbackError)
        throw fallbackError
      }
    }

    console.error('Error in getPurchasesByUser:', {
      error,
      code: error?.code,
      message: error?.message,
      userId,
    })
    throw error
  }
}

export async function getPurchaseById(purchaseId: string): Promise<Purchase | null> {
  const purchaseDoc = await getDoc(doc(requireDb(), 'purchases', purchaseId))
  if (!purchaseDoc.exists()) return null

  const data = purchaseDoc.data()
  return {
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
  } as Purchase
}

export async function updatePurchaseStatus(
  purchaseId: string,
  status: Purchase['status']
): Promise<void> {
  await updateDoc(doc(requireDb(), 'purchases', purchaseId), {
    status,
    updatedAt: Timestamp.now(),
  })
}

export async function updatePurchase(
  purchaseId: string,
  data: Partial<Pick<Purchase, 'status' | 'shipmentStatus' | 'trackingNumber'>>
): Promise<void> {
  const updateData: any = {
    updatedAt: Timestamp.now(),
  }

  if (data.status !== undefined) updateData.status = data.status
  if (data.shipmentStatus !== undefined) updateData.shipmentStatus = data.shipmentStatus
  if (data.trackingNumber !== undefined) {
    if (data.trackingNumber !== '') {
      updateData.trackingNumber = data.trackingNumber
    } else {
      updateData.trackingNumber = null
    }
  }

  await updateDoc(doc(requireDb(), 'purchases', purchaseId), updateData)
}

export async function getAllPurchases(): Promise<Purchase[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(
      collection(db, 'purchases'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
      } as Purchase
    })
  } catch (error: any) {
    console.error('Error fetching all purchases:', error)
    // Fallback without orderBy
    if (error?.code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(collection(db, 'purchases'))
        const purchases = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            id: doc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
          } as Purchase
        })
        return purchases.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback query:', fallbackError)
        return []
      }
    }
    return []
  }
}

// Product operations
export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = requireDb()
  const productRef = doc(collection(db, 'products'))
  try {
    const productData = {
      ...product,
      id: productRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(productRef, productData)
    console.log('Product created successfully:', productRef.id)
    return productRef.id
  } catch (error: any) {
    console.error('Error in createProduct:', {
      error,
      code: error?.code,
      message: error?.message,
      product,
    })
    throw error
  }
}

export async function getProducts(activeOnly: boolean = false): Promise<Product[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q
    if (activeOnly) {
      q = query(
        collection(db, 'products'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Product
    })
  } catch (error: any) {
    // Fallback if composite index is not ready
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready, using fallback query')
      try {
        const q = query(collection(db, 'products'))
        const snapshot = await getDocs(q)
        const products = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            ...data,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Product
        })
        // Filter and sort in memory
        const filtered = activeOnly ? products.filter(p => p.isActive) : products
        return filtered.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback query:', fallbackError)
        throw fallbackError
      }
    }

    console.error('Error in getProducts:', {
      error,
      code: error?.code,
      message: error?.message,
    })
    throw error
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  const productDoc = await getDoc(doc(requireDb(), 'products', productId))
  if (!productDoc.exists()) return null

  const data = productDoc.data()
  return {
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Product
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() }
  await updateDoc(doc(requireDb(), 'products', productId), updateData)
}

export async function updateProductStock(productId: string, quantity: number): Promise<void> {
  await updateDoc(doc(requireDb(), 'products', productId), {
    stock: quantity,
    updatedAt: Timestamp.now(),
  })
}

export async function decrementProductStock(productId: string, amount: number = 1): Promise<void> {
  const productRef = doc(requireDb(), 'products', productId)
  const productDoc = await getDoc(productRef)

  if (!productDoc.exists()) {
    throw new Error(`Product ${productId} not found`)
  }

  const currentStock = productDoc.data().stock || 0
  const newStock = Math.max(0, currentStock - amount)

  await updateDoc(productRef, {
    stock: newStock,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'products', productId))
}

export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const products = await getProducts(false)
    const defaultThreshold = threshold || 10
    return products.filter(
      (product) => product.isActive && product.stock <= defaultThreshold && product.stock > 0
    )
  } catch (error: any) {
    console.error('Error in getLowStockProducts:', error)
    return []
  }
}

// News functions
export async function createNews(news: Omit<News, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const newsRef = doc(collection(requireDb(), 'news'))

  // Remove undefined fields to avoid Firestore errors
  const cleanNews: any = {}
  if (news.title !== undefined) cleanNews.title = news.title
  if (news.description !== undefined) cleanNews.description = news.description
  if (news.content !== undefined && news.content !== '') cleanNews.content = news.content
  if (news.image !== undefined && news.image !== '') cleanNews.image = news.image
  if (news.author !== undefined && news.author !== '') cleanNews.author = news.author
  if (news.category !== undefined) cleanNews.category = news.category
  if (news.isPublished !== undefined) cleanNews.isPublished = news.isPublished

  const newsData = {
    ...cleanNews,
    id: newsRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    publishedAt: news.isPublished ? Timestamp.now() : null,
  }
  await setDoc(newsRef, newsData)
  return newsRef.id
}

export async function getNews(publishedOnly: boolean = true): Promise<News[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q = query(collection(requireDb(), 'news'), orderBy('createdAt', 'desc'))

    if (publishedOnly) {
      q = query(q, where('isPublished', '==', true))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
      } as News
    })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    // Fallback: try without published filter if composite index not ready
    if (publishedOnly && error.code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(query(collection(requireDb(), 'news'), orderBy('createdAt', 'desc')))
        return snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              ...data,
              id: doc.id,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
              publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
            } as News
          })
          .filter((news) => news.isPublished)
      } catch (fallbackError: any) {
        console.error('Error in fallback news query:', fallbackError)
        return []
      }
    }
    return []
  }
}

export async function getNewsById(newsId: string): Promise<News | null> {
  const newsDoc = await getDoc(doc(requireDb(), 'news', newsId))
  if (!newsDoc.exists()) return null

  const data = newsDoc.data()
  return {
    ...data,
    id: newsDoc.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
  } as News
}

export async function updateNews(newsId: string, data: Partial<News>): Promise<void> {
  // Remove undefined fields to avoid Firestore errors
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.content !== undefined) {
    // Only include content if it's not empty, or explicitly set to empty string to clear it
    if (data.content !== '') {
      updateData.content = data.content
    } else {
      // To remove a field, we need to use deleteField() or set to null
      updateData.content = null
    }
  }
  if (data.image !== undefined) {
    if (data.image !== '') {
      updateData.image = data.image
    } else {
      updateData.image = null
    }
  }
  if (data.author !== undefined) {
    if (data.author !== '') {
      updateData.author = data.author
    } else {
      updateData.author = null
    }
  }
  if (data.category !== undefined) updateData.category = data.category
  if (data.isPublished !== undefined) {
    updateData.isPublished = data.isPublished

    // If publishing for the first time, set publishedAt
    if (data.isPublished === true) {
      const existingNews = await getNewsById(newsId)
      if (existingNews && !existingNews.isPublished) {
        updateData.publishedAt = Timestamp.now()
      }
    }
  }

  await updateDoc(doc(requireDb(), 'news', newsId), updateData)
}

export async function deleteNews(newsId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, 'news', newsId))
}

// Video functions
export async function createVideo(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const videoRef = doc(collection(requireDb(), 'videos'))
  const cleanVideo: any = {}
  if (video.title !== undefined) cleanVideo.title = video.title
  if (video.description !== undefined && video.description !== '') cleanVideo.description = video.description
  if (video.youtubeUrl !== undefined) cleanVideo.youtubeUrl = video.youtubeUrl
  if (video.youtubeVideoId !== undefined) cleanVideo.youtubeVideoId = video.youtubeVideoId
  if (video.thumbnailUrl !== undefined && video.thumbnailUrl !== '') cleanVideo.thumbnailUrl = video.thumbnailUrl
  if (video.category !== undefined) cleanVideo.category = video.category
  if (video.tags !== undefined) cleanVideo.tags = video.tags
  if (video.durationLabel !== undefined && video.durationLabel !== '') cleanVideo.durationLabel = video.durationLabel
  if (video.isPublished !== undefined) cleanVideo.isPublished = video.isPublished
  if (video.isFeatured !== undefined) cleanVideo.isFeatured = video.isFeatured
  if (video.order !== undefined) cleanVideo.order = video.order
  if (video.createdBy !== undefined) cleanVideo.createdBy = video.createdBy

  await setDoc(videoRef, {
    ...cleanVideo,
    id: videoRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return videoRef.id
}

export async function getVideos(publishedOnly: boolean = true): Promise<Video[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  const mapDocs = (snapshot: any): Video[] =>
    snapshot.docs.map((docSnap: any) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Video
    })

  try {
    let q = query(collection(requireDb(), 'videos'), orderBy('order', 'asc'), orderBy('createdAt', 'desc'))
    if (publishedOnly) {
      q = query(q, where('isPublished', '==', true))
    }
    const snapshot = await getDocs(q)
    return mapDocs(snapshot)
  } catch (error: any) {
    console.error('Error fetching videos:', error)
    // Fallback for missing composite index
    if (error?.code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(collection(requireDb(), 'videos'))
        const videos = mapDocs(snapshot)
        const filtered = publishedOnly ? videos.filter((v) => v.isPublished) : videos
        filtered.sort((a, b) => {
          if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0)
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime()
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime()
          return bDate - aDate
        })
        return filtered
      } catch (fallbackError: any) {
        console.error('Error in fallback video query:', fallbackError)
        return []
      }
    }
    return []
  }
}

export async function updateVideo(videoId: string, data: Partial<Video>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.youtubeUrl !== undefined) updateData.youtubeUrl = data.youtubeUrl
  if (data.youtubeVideoId !== undefined) updateData.youtubeVideoId = data.youtubeVideoId
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl || null
  if (data.category !== undefined) updateData.category = data.category
  if (data.tags !== undefined) updateData.tags = data.tags
  if (data.durationLabel !== undefined) updateData.durationLabel = data.durationLabel || null
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
  if (data.order !== undefined) updateData.order = data.order
  await updateDoc(doc(requireDb(), 'videos', videoId), updateData)
}

export async function deleteVideo(videoId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'videos', videoId))
}

// Petition operations
export async function createPetition(
  petition: Omit<Petition, 'id' | 'createdAt' | 'updatedAt' | 'currentSignatures' | 'signatures'>
): Promise<string> {
  const petitionRef = doc(collection(requireDb(), 'petitions'))

  const cleanPetition: any = {}
  if (petition.title !== undefined) cleanPetition.title = petition.title
  if (petition.description !== undefined) cleanPetition.description = petition.description
  if (petition.content !== undefined && petition.content !== '') cleanPetition.content = petition.content
  if (petition.image !== undefined && petition.image !== '') cleanPetition.image = petition.image
  if (petition.goal !== undefined) cleanPetition.goal = petition.goal
  if (petition.isActive !== undefined) cleanPetition.isActive = petition.isActive
  if (petition.isPublished !== undefined) cleanPetition.isPublished = petition.isPublished
  if (petition.createdBy !== undefined) cleanPetition.createdBy = petition.createdBy
  if (petition.expiresAt !== undefined) cleanPetition.expiresAt = petition.expiresAt

  const petitionData = {
    ...cleanPetition,
    id: petitionRef.id,
    currentSignatures: 0,
    signatures: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    publishedAt: petition.isPublished ? Timestamp.now() : null,
  }
  await setDoc(petitionRef, petitionData)
  return petitionRef.id
}

export async function getPetitions(publishedOnly: boolean = true, activeOnly: boolean = true): Promise<Petition[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q = query(collection(requireDb(), 'petitions'), orderBy('createdAt', 'desc'))

    if (publishedOnly) {
      q = query(q, where('isPublished', '==', true))
    }
    if (activeOnly) {
      q = query(q, where('isActive', '==', true))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
        expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
        signatures: (data.signatures || []).map((sig: any) => ({
          ...sig,
          signedAt: toDate(sig.signedAt),
        })),
      } as Petition
    })
  } catch (error: any) {
    console.error('Error fetching petitions:', error)
    // Fallback: try without filters if composite index not ready
    if (error.code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(query(collection(requireDb(), 'petitions'), orderBy('createdAt', 'desc')))
        return snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              ...data,
              id: doc.id,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
              publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
              expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
              signatures: (data.signatures || []).map((sig: any) => ({
                ...sig,
                signedAt: toDate(sig.signedAt),
              })),
            } as Petition
          })
          .filter((petition) => {
            if (publishedOnly && !petition.isPublished) return false
            if (activeOnly && !petition.isActive) return false
            return true
          })
      } catch (fallbackError: any) {
        console.error('Error in fallback petition query:', fallbackError)
        return []
      }
    }
    return []
  }
}

export async function getPetitionById(petitionId: string): Promise<Petition | null> {
  const petitionDoc = await getDoc(doc(requireDb(), 'petitions', petitionId))
  if (!petitionDoc.exists()) return null

  const data = petitionDoc.data()
  return {
    ...data,
    id: petitionDoc.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    publishedAt: data.publishedAt ? toDate(data.publishedAt) : undefined,
    expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
    signatures: (data.signatures || []).map((sig: any) => ({
      ...sig,
      signedAt: toDate(sig.signedAt),
    })),
  } as Petition
}

export async function updatePetition(petitionId: string, data: Partial<Petition>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.content !== undefined) {
    if (data.content !== '') {
      updateData.content = data.content
    } else {
      updateData.content = null
    }
  }
  if (data.image !== undefined) {
    if (data.image !== '') {
      updateData.image = data.image
    } else {
      updateData.image = null
    }
  }
  if (data.goal !== undefined) updateData.goal = data.goal
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.isPublished !== undefined) {
    updateData.isPublished = data.isPublished
    if (data.isPublished && !data.publishedAt) {
      updateData.publishedAt = Timestamp.now()
    }
  }
  if (data.expiresAt !== undefined) {
    if (data.expiresAt) {
      updateData.expiresAt = data.expiresAt instanceof Date ? Timestamp.fromDate(data.expiresAt) : data.expiresAt
    } else {
      updateData.expiresAt = null
    }
  }

  await updateDoc(doc(requireDb(), 'petitions', petitionId), updateData)
}

export async function deletePetition(petitionId: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'petitions', petitionId), { isActive: false, isPublished: false })
  // Or use deleteDoc if you want to permanently delete:
  // await deleteDoc(doc(requireDb(), 'petitions', petitionId))
}

export async function signPetition(
  petitionId: string,
  signature: Omit<PetitionSignature, 'signedAt'>
): Promise<void> {
  const petitionRef = doc(requireDb(), 'petitions', petitionId)
  const petitionDoc = await getDoc(petitionRef)

  if (!petitionDoc.exists()) {
    throw new Error('Petition not found')
  }

  const petitionData = petitionDoc.data() as Petition
  const signatures = petitionData.signatures || []

  // Check if user already signed (if userId provided)
  if (signature.userId) {
    const alreadySigned = signatures.some((sig) => sig.userId === signature.userId)
    if (alreadySigned) {
      throw new Error('You have already signed this petition')
    }
  }

  // Check if email already signed
  const emailSigned = signatures.some((sig) => sig.email.toLowerCase() === signature.email.toLowerCase())
  if (emailSigned) {
    throw new Error('This email has already signed this petition')
  }

  const newSignature: PetitionSignature = {
    name: signature.name,
    email: signature.email,
    anonymous: signature.anonymous,
    userId: signature.userId || null,
    signedAt: Timestamp.now(),
  } as PetitionSignature

  await updateDoc(petitionRef, {
    signatures: [...signatures, newSignature],
    currentSignatures: signatures.length + 1,
    updatedAt: Timestamp.now(),
  })

  // Non-blocking admin notification for new petition signatures.
  try {
    const signerName = signature.anonymous ? 'Anonymous signer' : signature.name
    await createNotification({
      type: 'new_petition',
      title: 'New Petition Signature',
      message: `${signerName} signed "${petitionData.title}".`,
      link: '/dashboard/admin/petition-signatures',
      audience: 'admin',
    })
  } catch (error) {
    console.error('Failed to create petition signature notification:', error)
  }
}

// Cart operations
export async function saveUserCart(userId: string, cartItems: CartItem[]): Promise<void> {
  const cartData = {
    items: cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      // Store minimal product data for reference
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        description: item.product.description,
        stock: item.product.stock,
        lowStockThreshold: item.product.lowStockThreshold,
        isActive: item.product.isActive,
      },
    })),
    updatedAt: Timestamp.now(),
  }

  await setDoc(doc(requireDb(), 'carts', userId), cartData, { merge: true })
}

export async function getUserCart(userId: string): Promise<CartItem[]> {
  try {
    const cartDoc = await getDoc(doc(requireDb(), 'carts', userId))
    if (!cartDoc.exists()) return []

    const cartData = cartDoc.data()
    const items = cartData.items || []

    // Fetch full product data for each cart item
    const cartItems: CartItem[] = []
    for (const item of items) {
      try {
        const productDoc = await getDoc(doc(requireDb(), 'products', item.productId))
        if (productDoc.exists()) {
          const productData = productDoc.data()
          cartItems.push({
            productId: item.productId,
            product: {
              id: productData.id || productDoc.id,
              name: productData.name,
              description: productData.description,
              price: productData.price,
              image: productData.image,
              stock: productData.stock,
              lowStockThreshold: productData.lowStockThreshold,
              isActive: productData.isActive,
              createdAt: toDate(productData.createdAt),
              updatedAt: toDate(productData.updatedAt),
            },
            quantity: item.quantity,
          })
        }
      } catch (error) {
        console.error(`Error loading product ${item.productId}:`, error)
      }
    }

    return cartItems
  } catch (error) {
    console.error('Error loading user cart:', error)
    return []
  }
}

export async function clearUserCart(userId: string): Promise<void> {
  await setDoc(doc(requireDb(), 'carts', userId), { items: [], updatedAt: Timestamp.now() }, { merge: true })
}

// Newsletter subscription operations
export async function createNewsletterSubscription(
  subscription: Omit<NewsletterSubscription, 'id' | 'createdAt' | 'updatedAt' | 'subscribed'>
): Promise<string> {
  const db = requireDb()
  const subscriptionRef = doc(collection(db, 'newsletterSubscriptions'))

  try {
    // Check if email already exists
    const existingQuery = query(
      collection(db, 'newsletterSubscriptions'),
      where('email', '==', subscription.email.toLowerCase().trim())
    )
    const existingSnapshot = await getDocs(existingQuery)

    if (!existingSnapshot.empty) {
      // Update existing subscription to subscribed
      const existingDoc = existingSnapshot.docs[0]
      await updateDoc(existingDoc.ref, {
        subscribed: true,
        updatedAt: Timestamp.now(),
        userId: subscription.userId || null,
      })
      return existingDoc.id
    }

    // Create new subscription
    const subscriptionData = {
      email: subscription.email.toLowerCase().trim(),
      userId: subscription.userId || null,
      subscribed: true,
      id: subscriptionRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(subscriptionRef, subscriptionData)
    console.log('Newsletter subscription created successfully:', subscriptionRef.id)
    return subscriptionRef.id
  } catch (error: any) {
    console.error('Error in createNewsletterSubscription:', {
      error,
      code: error?.code,
      message: error?.message,
      subscription,
    })
    throw error
  }
}

// Banner operations
export async function createBanner(
  banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const bannerRef = doc(collection(db, 'banners'))

  try {
    const bannerData = {
      imageUrl: banner.imageUrl,
      title: banner.title || null,
      subtitle: banner.subtitle || null,
      description: banner.description || null,
      isActive: banner.isActive,
      order: banner.order,
      id: bannerRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(bannerRef, bannerData)
    console.log('Banner created successfully:', bannerRef.id)
    return bannerRef.id
  } catch (error: any) {
    console.error('Error in createBanner:', error)
    throw error
  }
}

export async function getBanners(activeOnly: boolean = false): Promise<Banner[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q
    if (activeOnly) {
      q = query(
        collection(db, 'banners'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      )
    } else {
      q = query(
        collection(db, 'banners'),
        orderBy('order', 'asc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Banner
    })
  } catch (error: any) {
    // Fallback if composite index not ready
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready for banners, using fallback')
      try {
        const snapshot = await getDocs(collection(db, 'banners'))
        const banners = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Banner
        })
        const filtered = activeOnly ? banners.filter(b => b.isActive) : banners
        return filtered.sort((a, b) => a.order - b.order)
      } catch (fallbackError: any) {
        console.error('Error in fallback banner query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching banners:', error)
    return []
  }
}

export async function updateBanner(bannerId: string, data: Partial<Banner>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
  if (data.title !== undefined) updateData.title = data.title || null
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle || null
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.order !== undefined) updateData.order = data.order

  await updateDoc(doc(requireDb(), 'banners', bannerId), updateData)
}

export async function deleteBanner(bannerId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'banners', bannerId))
}

// Gallery Category operations
export async function createGalleryCategory(
  category: Omit<GalleryCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const catRef = doc(collection(db, 'galleryCategories'))

  try {
    const catData = {
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      coverImage: category.coverImage || null,
      order: category.order,
      isActive: category.isActive,
      id: catRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(catRef, catData)
    return catRef.id
  } catch (error: any) {
    console.error('Error in createGalleryCategory:', error)
    throw error
  }
}

export async function getGalleryCategories(activeOnly: boolean = false): Promise<GalleryCategory[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q
    if (activeOnly) {
      q = query(
        collection(db, 'galleryCategories'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      )
    } else {
      q = query(
        collection(db, 'galleryCategories'),
        orderBy('order', 'asc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as GalleryCategory
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready for galleryCategories, using fallback')
      try {
        const snapshot = await getDocs(collection(db, 'galleryCategories'))
        const categories = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as GalleryCategory
        })
        const filtered = activeOnly ? categories.filter(c => c.isActive) : categories
        return filtered.sort((a, b) => a.order - b.order)
      } catch (fallbackError: any) {
        console.error('Error in fallback galleryCategories query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching gallery categories:', error)
    return []
  }
}

export async function updateGalleryCategory(categoryId: string, data: Partial<GalleryCategory>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.order !== undefined) updateData.order = data.order

  await updateDoc(doc(requireDb(), 'galleryCategories', categoryId), updateData)
}

export async function deleteGalleryCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'galleryCategories', categoryId))
}

// Gallery Image operations
export async function createGalleryImage(
  image: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const imgRef = doc(collection(db, 'galleryImages'))

  try {
    const imgData = {
      imageUrl: image.imageUrl,
      title: image.title || null,
      description: image.description || null,
      categoryId: image.categoryId,
      categoryName: image.categoryName,
      isPublished: image.isPublished,
      order: image.order,
      id: imgRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(imgRef, imgData)
    return imgRef.id
  } catch (error: any) {
    console.error('Error in createGalleryImage:', error)
    throw error
  }
}

export async function getGalleryImages(publishedOnly: boolean = false, categoryId?: string): Promise<GalleryImage[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q = query(collection(db, 'galleryImages'), orderBy('order', 'asc'))

    if (publishedOnly) {
      q = query(q, where('isPublished', '==', true))
    }
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as GalleryImage
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition' || error?.code === 'permission-denied') {
      console.warn('Composite index not ready or permission issue for galleryImages, using fallback')
      try {
        // For unauthenticated users, must filter by isPublished to satisfy security rules
        let fallbackQuery = publishedOnly
          ? query(collection(db, 'galleryImages'), where('isPublished', '==', true))
          : query(collection(db, 'galleryImages'))

        const snapshot = await getDocs(fallbackQuery)
        let images = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as GalleryImage
        })
        if (categoryId) images = images.filter(i => i.categoryId === categoryId)
        return images.sort((a, b) => a.order - b.order)
      } catch (fallbackError: any) {
        console.error('Error in fallback galleryImages query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching gallery images:', error)
    return []
  }
}

export async function updateGalleryImage(imageId: string, data: Partial<GalleryImage>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
  if (data.title !== undefined) updateData.title = data.title || null
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
  if (data.categoryName !== undefined) updateData.categoryName = data.categoryName
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
  if (data.order !== undefined) updateData.order = data.order

  await updateDoc(doc(requireDb(), 'galleryImages', imageId), updateData)
}

export async function deleteGalleryImage(imageId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'galleryImages', imageId))
}

// Survey operations
export async function createSurvey(
  survey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'responseCount'>
): Promise<string> {
  const db = requireDb()
  const surveyRef = doc(collection(db, 'surveys'))

  try {
    const surveyData = {
      title: survey.title,
      description: survey.description,
      category: survey.category,
      status: survey.status,
      isPublic: survey.isPublic,
      allowAnonymous: survey.allowAnonymous,
      showResults: survey.showResults,
      responseGoal: survey.responseGoal || null,
      responseCount: 0,
      deadline: survey.deadline || null,
      questions: survey.questions,
      createdBy: survey.createdBy,
      id: surveyRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(surveyRef, surveyData)
    console.log('Survey created successfully:', surveyRef.id)
    return surveyRef.id
  } catch (error: any) {
    console.error('Error in createSurvey:', error)
    throw error
  }
}

// filter: 'active' = only active, 'published' = active + closed (no drafts), 'all' = everything (admin only)
export async function getSurveys(filter: boolean | 'active' | 'published' | 'all' = 'all'): Promise<Survey[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  // Support legacy boolean: true = 'active', false = 'all'
  const mode = typeof filter === 'boolean' ? (filter ? 'active' : 'all') : filter

  const mapDoc = (docSnap: any): Survey => {
    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      deadline: data.deadline ? toDate(data.deadline) : undefined,
    } as Survey
  }

  const sortByDate = (surveys: Survey[]) =>
    surveys.sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
      return bDate - aDate
    })

  // --- Mode: 'active' — only active surveys (works for unauthenticated users) ---
  if (mode === 'active') {
    // Strategy 1: Composite query (requires index)
    try {
      const q = query(
        collection(db, 'surveys'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(mapDoc)
    } catch (error: any) {
      console.warn('Surveys active composite query failed, trying simple where:', error?.code || error?.message)
    }
    // Strategy 2: Simple where without orderBy
    try {
      const q = query(
        collection(db, 'surveys'),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)
      return sortByDate(snapshot.docs.map(mapDoc))
    } catch (error: any) {
      console.error('Surveys active query failed:', error?.code || error?.message)
      return []
    }
  }

  // --- Mode: 'published' — active + closed (works for unauthenticated users) ---
  if (mode === 'published') {
    // Strategy 1: Use Firestore 'in' query (active + closed)
    try {
      const q = query(
        collection(db, 'surveys'),
        where('status', 'in', ['active', 'closed']),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(mapDoc)
    } catch (error: any) {
      console.warn('Surveys published composite query failed, trying simple where:', error?.code || error?.message)
    }
    // Strategy 2: 'in' without orderBy
    try {
      const q = query(
        collection(db, 'surveys'),
        where('status', 'in', ['active', 'closed'])
      )
      const snapshot = await getDocs(q)
      return sortByDate(snapshot.docs.map(mapDoc))
    } catch (error: any) {
      console.warn('Surveys published where-only query failed, trying per-status:', error?.code || error?.message)
    }
    // Strategy 3: Fetch active and closed separately, merge
    try {
      const [activeSnap, closedSnap] = await Promise.all([
        getDocs(query(collection(db, 'surveys'), where('status', '==', 'active'))),
        getDocs(query(collection(db, 'surveys'), where('status', '==', 'closed'))),
      ])
      const surveys = [...activeSnap.docs.map(mapDoc), ...closedSnap.docs.map(mapDoc)]
      return sortByDate(surveys)
    } catch (error: any) {
      console.error('All surveys published query strategies failed:', error?.code || error?.message)
      return []
    }
  }

  // --- Mode: 'all' — everything including drafts (admin only) ---
  try {
    const q = query(
      collection(db, 'surveys'),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(mapDoc)
  } catch (error: any) {
    console.warn('Surveys all query failed, trying unordered:', error?.code || error?.message)
  }
  try {
    const snapshot = await getDocs(collection(db, 'surveys'))
    return sortByDate(snapshot.docs.map(mapDoc))
  } catch (fallbackError: any) {
    console.error('All survey query strategies failed:', fallbackError?.code || fallbackError?.message)
    return []
  }
}

export async function getSurveyById(surveyId: string): Promise<Survey | null> {
  const surveyDoc = await getDoc(doc(requireDb(), 'surveys', surveyId))
  if (!surveyDoc.exists()) return null

  const data = surveyDoc.data()
  return {
    ...data,
    id: surveyDoc.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    deadline: data.deadline ? toDate(data.deadline) : undefined,
  } as Survey
}

export async function updateSurvey(surveyId: string, data: Partial<Survey>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.category !== undefined) updateData.category = data.category
  if (data.status !== undefined) updateData.status = data.status
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
  if (data.allowAnonymous !== undefined) updateData.allowAnonymous = data.allowAnonymous
  if (data.showResults !== undefined) updateData.showResults = data.showResults
  if (data.responseGoal !== undefined) updateData.responseGoal = data.responseGoal || null
  if (data.deadline !== undefined) {
    if (data.deadline) {
      updateData.deadline = data.deadline instanceof Date ? Timestamp.fromDate(data.deadline) : data.deadline
    } else {
      updateData.deadline = null
    }
  }
  if (data.questions !== undefined) updateData.questions = data.questions

  await updateDoc(doc(requireDb(), 'surveys', surveyId), updateData)
}

export async function deleteSurvey(surveyId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'surveys', surveyId))
}

// Survey Response operations
export async function submitSurveyResponse(
  response: Omit<SurveyResponse, 'id' | 'submittedAt'>
): Promise<string> {
  const db = requireDb()
  const responseRef = doc(collection(db, 'surveyResponses'))

  try {
    const responseData = {
      surveyId: response.surveyId,
      userId: response.userId || null,
      isAnonymous: response.isAnonymous,
      answers: response.answers,
      id: responseRef.id,
      submittedAt: Timestamp.now(),
    }

    await setDoc(responseRef, responseData)

    // Increment responseCount on the survey (non-blocking — don't fail submission if this errors)
    try {
      const surveyRef = doc(db, 'surveys', response.surveyId)
      const surveyDoc = await getDoc(surveyRef)
      if (surveyDoc.exists()) {
        const currentCount = surveyDoc.data().responseCount || 0
        await updateDoc(surveyRef, {
          responseCount: currentCount + 1,
          updatedAt: Timestamp.now(),
        })
      }
    } catch (countError: any) {
      console.warn('Could not increment survey responseCount:', countError?.code || countError?.message)
    }

    console.log('Survey response submitted successfully:', responseRef.id)
    return responseRef.id
  } catch (error: any) {
    console.error('Error in submitSurveyResponse:', error)
    throw error
  }
}

export async function getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(
      collection(db, 'surveyResponses'),
      where('surveyId', '==', surveyId),
      orderBy('submittedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        submittedAt: toDate(data.submittedAt),
      } as SurveyResponse
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready for surveyResponses, using fallback')
      try {
        const q = query(
          collection(db, 'surveyResponses'),
          where('surveyId', '==', surveyId)
        )
        const snapshot = await getDocs(q)
        const responses = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            submittedAt: toDate(data.submittedAt),
          } as SurveyResponse
        })
        return responses.sort((a, b) => {
          const aDate = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0
          const bDate = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback surveyResponses query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching survey responses:', error)
    return []
  }
}

export async function hasUserRespondedToSurvey(surveyId: string, userId: string): Promise<boolean> {
  if (!db) return false

  try {
    const q = query(
      collection(db, 'surveyResponses'),
      where('surveyId', '==', surveyId),
      where('userId', '==', userId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error: any) {
    console.error('Error checking survey response:', error)
    return false
  }
}

// ====================== Membership Application Operations ======================

export async function createMembershipApplication(
  application: Omit<MembershipApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  const db = requireDb()
  const appRef = doc(collection(db, 'membershipApplications'))

  try {
    // Filter out undefined values
    const cleanApp: any = {}
    Object.keys(application).forEach((key) => {
      const value = (application as any)[key]
      if (value !== undefined) {
        cleanApp[key] = value
      }
    })

    const appData = {
      ...cleanApp,
      status: 'pending' as MembershipApplicationStatus,
      id: appRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(appRef, appData)
    console.log('Membership application created successfully:', appRef.id)
    return appRef.id
  } catch (error: any) {
    console.error('Error in createMembershipApplication:', {
      error,
      code: error?.code,
      message: error?.message,
    })
    throw error
  }
}

export async function getMembershipApplications(): Promise<MembershipApplication[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    const q = query(collection(db, 'membershipApplications'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as MembershipApplication
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      console.warn('Index not ready for membershipApplications, using fallback')
      try {
        const snapshot = await getDocs(collection(db, 'membershipApplications'))
        const apps = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as MembershipApplication
        })
        return apps.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback membershipApplications query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching membership applications:', error)
    return []
  }
}

export async function getMembershipApplicationByUser(userId: string): Promise<MembershipApplication | null> {
  if (!db) {
    console.warn('Firestore not initialized')
    return null
  }

  try {
    const q = query(
      collection(db, 'membershipApplications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const data = snapshot.docs[0].data()
    return {
      ...data,
      id: snapshot.docs[0].id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as MembershipApplication
  } catch (error: any) {
    // Fallback without orderBy
    try {
      const q = query(
        collection(db, 'membershipApplications'),
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)
      if (snapshot.empty) return null

      const apps = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          ...data,
          id: docSnap.id,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as MembershipApplication
      })
      apps.sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return bDate - aDate
      })
      return apps[0] || null
    } catch (fallbackError: any) {
      console.error('Error fetching membership application by user:', fallbackError)
      return null
    }
  }
}

export async function updateMembershipApplication(
  applicationId: string,
  data: Partial<MembershipApplication>
): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.status !== undefined) updateData.status = data.status
  if (data.membershipNumber !== undefined) updateData.membershipNumber = data.membershipNumber
  if (data.provinceAllocated !== undefined) updateData.provinceAllocated = data.provinceAllocated
  if (data.dateReceived !== undefined) updateData.dateReceived = data.dateReceived
  if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy
  if (data.reviewNotes !== undefined) updateData.reviewNotes = data.reviewNotes

  await updateDoc(doc(requireDb(), 'membershipApplications', applicationId), updateData)
}

export async function deleteMembershipApplication(applicationId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'membershipApplications', applicationId))
}

// ====================== Youth Module Operations ======================

export async function upsertYouthProfile(
  userId: string,
  profile: Omit<YouthProfile, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const db = requireDb()
  const ref = doc(db, 'youthProfiles', userId)
  const existing = await getDoc(ref)

  const payload: Record<string, any> = {
    userId,
    ageBand: profile.ageBand,
    province: profile.province,
    interests: profile.interests || [],
    updatedAt: Timestamp.now(),
  }

  if (profile.district !== undefined) payload.district = profile.district
  if (profile.institution !== undefined) payload.institution = profile.institution
  if (profile.goals !== undefined) payload.goals = profile.goals
  if (!existing.exists()) payload.createdAt = Timestamp.now()

  await setDoc(ref, payload, { merge: true })
}

export async function getYouthProfile(userId: string): Promise<YouthProfile | null> {
  const db = requireDb()
  const snapshot = await getDoc(doc(db, 'youthProfiles', userId))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    ...data,
    userId: snapshot.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as YouthProfile
}

export async function createYouthMission(
  mission: Omit<YouthMission, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const ref = doc(collection(db, 'youthMissions'))
  await setDoc(ref, {
    ...mission,
    id: ref.id,
    dueDate: mission.dueDate ? Timestamp.fromDate(new Date(mission.dueDate as any)) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export async function updateYouthMission(
  missionId: string,
  data: Partial<YouthMission>
): Promise<void> {
  const db = requireDb()
  const payload: Record<string, any> = { updatedAt: Timestamp.now() }
  if (data.title !== undefined) payload.title = data.title
  if (data.description !== undefined) payload.description = data.description
  if (data.category !== undefined) payload.category = data.category
  if (data.points !== undefined) payload.points = data.points
  if (data.estimatedMinutes !== undefined) payload.estimatedMinutes = data.estimatedMinutes
  if (data.isActive !== undefined) payload.isActive = data.isActive
  if (data.dueDate !== undefined) {
    payload.dueDate = data.dueDate ? Timestamp.fromDate(new Date(data.dueDate as any)) : null
  }
  await updateDoc(doc(db, 'youthMissions', missionId), payload)
}

export async function deleteYouthMission(missionId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'youthMissions', missionId))
}

export async function getYouthMissions(activeOnly: boolean = true): Promise<YouthMission[]> {
  const db = requireDb()
  try {
    let q = query(collection(db, 'youthMissions'), orderBy('createdAt', 'desc'))
    if (activeOnly) q = query(q, where('isActive', '==', true))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
      } as YouthMission
    })
  } catch (error: any) {
    // Fallback for missing composite index.
    if (error?.code !== 'failed-precondition') throw error
    const snapshot = await getDocs(collection(db, 'youthMissions'))
    const missions = snapshot.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        dueDate: data.dueDate ? toDate(data.dueDate) : undefined,
      } as YouthMission
    })
    const filtered = activeOnly ? missions.filter((m) => m.isActive) : missions
    filtered.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as any).getTime()
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as any).getTime()
      return dateB - dateA
    })
    return filtered
  }
}

export async function submitYouthMission(
  missionId: string,
  userId: string,
  data?: { notes?: string; proofUrl?: string }
): Promise<string> {
  const db = requireDb()
  const submissionId = `${missionId}_${userId}`
  const ref = doc(db, 'youthMissionSubmissions', submissionId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new Error('You have already submitted this mission.')
  }

  const payload: Record<string, any> = {
    id: submissionId,
    missionId,
    userId,
    status: 'submitted',
    submittedAt: Timestamp.now(),
  }
  if (data?.notes) payload.notes = data.notes
  if (data?.proofUrl) payload.proofUrl = data.proofUrl

  await setDoc(ref, payload)
  return submissionId
}

export async function getYouthMissionSubmissionsByUser(userId: string): Promise<YouthMissionSubmission[]> {
  const db = requireDb()
  const q = query(collection(db, 'youthMissionSubmissions'), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  const submissions = snapshot.docs.map((d) => {
    const data = d.data()
    return {
      ...data,
      id: d.id,
      submittedAt: toDate(data.submittedAt),
      reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
    } as YouthMissionSubmission
  })
  submissions.sort((a, b) => {
    const aTime = a.submittedAt instanceof Date ? a.submittedAt.getTime() : new Date(a.submittedAt as any).getTime()
    const bTime = b.submittedAt instanceof Date ? b.submittedAt.getTime() : new Date(b.submittedAt as any).getTime()
    return bTime - aTime
  })
  return submissions
}

// ====================== Notification Operations ======================

export async function createNotification(
  notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read' | 'readBy' | 'audience' | 'userId'> & { audience?: NotificationAudience; userId?: string }
): Promise<string> {
  const db = requireDb()
  const notifRef = doc(collection(db, 'notifications'))

  try {
    const notifData = {
      ...notification,
      id: notifRef.id,
      read: false,
      readBy: [],
      audience: notification.audience || 'admin',
      createdAt: Timestamp.now(),
    }
    await setDoc(notifRef, notifData)
    return notifRef.id
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return ''
  }
}

export async function getNotifications(limitCount: number = 20): Promise<AdminNotification[]> {
  if (!db) return []

  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        readBy: data.readBy || [],
        audience: data.audience || 'admin',
        createdAt: toDate(data.createdAt),
      } as AdminNotification
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

// Subscribe to admin notifications (all notifications)
export function subscribeToNotifications(
  limitCount: number = 20,
  callback: (notifications: AdminNotification[]) => void
): () => void {
  if (!db) return () => {}

  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        readBy: data.readBy || [],
        audience: data.audience || 'admin',
        createdAt: toDate(data.createdAt),
      } as AdminNotification
    })
    callback(notifications)
  }, (error) => {
    console.error('Error in notifications listener:', error)
  })
}

// Subscribe to user-facing notifications (broadcast + user-specific)
export function subscribeToUserNotifications(
  userId: string,
  limitCount: number = 20,
  callback: (notifications: AdminNotification[]) => void
): () => void {
  if (!db || !userId) return () => {}

  let broadcastNotifs: AdminNotification[] = []
  let userNotifs: AdminNotification[] = []

  function mergeAndCallback() {
    const merged = [...broadcastNotifs, ...userNotifs]
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return bTime - aTime
      })
      .slice(0, limitCount)
    callback(merged)
  }

  // Listener 1: Broadcast notifications (audience == 'all')
  const q1 = query(
    collection(db, 'notifications'),
    where('audience', '==', 'all'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  const unsub1 = onSnapshot(q1, (snapshot) => {
    broadcastNotifs = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        readBy: data.readBy || [],
        audience: data.audience || 'all',
        createdAt: toDate(data.createdAt),
      } as AdminNotification
    })
    mergeAndCallback()
  }, (error) => {
    console.error('Error in broadcast notifications listener:', error)
  })

  // Listener 2: User-specific notifications (audience == 'user' && userId matches)
  const q2 = query(
    collection(db, 'notifications'),
    where('audience', '==', 'user'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  const unsub2 = onSnapshot(q2, (snapshot) => {
    userNotifs = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        readBy: data.readBy || [],
        audience: data.audience || 'user',
        createdAt: toDate(data.createdAt),
      } as AdminNotification
    })
    mergeAndCallback()
  }, (error) => {
    console.error('Error in user notifications listener:', error)
  })

  return () => {
    unsub1()
    unsub2()
  }
}

export async function markNotificationRead(notificationId: string, userId?: string): Promise<void> {
  const db = requireDb()
  const updateData: Record<string, any> = userId
    ? { readBy: arrayUnion(userId) }
    : { read: true }
  await updateDoc(doc(db, 'notifications', notificationId), updateData)
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  const db = requireDb()

  try {
    const q = query(
      collection(db, 'notifications'),
      where('read', '==', false)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return

    const batch = writeBatch(db)
    snapshot.docs.forEach((docSnap) => {
      const updateData: Record<string, any> = { read: true }
      if (userId) {
        updateData.readBy = arrayUnion(userId)
      }
      batch.update(docSnap.ref, updateData)
    })
    await batch.commit()
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
  }
}

export async function markUserNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
  const db = requireDb()

  try {
    const batch = writeBatch(db)
    for (const id of notificationIds) {
      batch.update(doc(db, 'notifications', id), {
        readBy: arrayUnion(userId),
      })
    }
    await batch.commit()
  } catch (error: any) {
    console.error('Error marking user notifications as read:', error)
  }
}

// ─── Email Log Operations ─────────────────────────────────────────
export async function createEmailLog(emailLog: Omit<EmailLog, 'id' | 'createdAt'>): Promise<string> {
  const db = requireDb()
  const emailRef = doc(collection(db, 'emails'))

  try {
    const emailData = {
      ...emailLog,
      id: emailRef.id,
      createdAt: Timestamp.now(),
    }

    await setDoc(emailRef, emailData)
    return emailRef.id
  } catch (error: any) {
    console.error('Error creating email log:', error)
    return ''
  }
}

export async function getEmailLogs(limitCount: number = 50): Promise<EmailLog[]> {
  if (!db) return []

  try {
    const q = query(
      collection(db, 'emails'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
      } as EmailLog
    })
  } catch (error: any) {
    console.error('Error fetching email logs:', error)
    return []
  }
}

// ─── Leadership CRUD ───────────────────────────────────────────────────────────

export async function createLeader(
  leader: Omit<Leader, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const leaderRef = doc(collection(db, 'leaders'))

  try {
    const leaderData = {
      name: leader.name,
      title: leader.title,
      bio: leader.bio,
      imageUrl: leader.imageUrl || null,
      xHandle: leader.xHandle || '',
      order: leader.order,
      isActive: leader.isActive,
      id: leaderRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    await setDoc(leaderRef, leaderData)
    console.log('Leader created successfully:', leaderRef.id)
    return leaderRef.id
  } catch (error: any) {
    console.error('Error in createLeader:', error)
    throw error
  }
}

export async function getLeaders(activeOnly: boolean = false): Promise<Leader[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q
    if (activeOnly) {
      q = query(
        collection(db, 'leaders'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      )
    } else {
      q = query(
        collection(db, 'leaders'),
        orderBy('order', 'asc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Leader
    })
  } catch (error: any) {
    // Fallback if composite index not ready
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready for leaders, using fallback')
      try {
        const snapshot = await getDocs(collection(db, 'leaders'))
        const leaders = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Leader
        })
        const filtered = activeOnly ? leaders.filter(l => l.isActive) : leaders
        return filtered.sort((a, b) => a.order - b.order)
      } catch (fallbackError: any) {
        console.error('Error in fallback leaders query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching leaders:', error)
    return []
  }
}

export async function updateLeader(leaderId: string, data: Partial<Leader>): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.name !== undefined) updateData.name = data.name
  if (data.title !== undefined) updateData.title = data.title
  if (data.bio !== undefined) updateData.bio = data.bio
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null
  if (data.xHandle !== undefined) updateData.xHandle = data.xHandle || ''
  if (data.order !== undefined) updateData.order = data.order
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  await updateDoc(doc(requireDb(), 'leaders', leaderId), updateData)
}

export async function deleteLeader(leaderId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'leaders', leaderId))
}

// ─── Organizations (affiliates) ───────────────────────────────────────────────

export async function getOrganizations(activeOnly: boolean = true): Promise<Organization[]> {
  if (!db) {
    console.warn('Firestore not initialized')
    return []
  }

  try {
    let q
    if (activeOnly) {
      q = query(
        collection(db, 'organizations'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      )
    } else {
      q = query(collection(db, 'organizations'), orderBy('order', 'asc'))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Organization
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      console.warn('Composite index not ready for organizations, using fallback query')
      try {
        const snapshot = await getDocs(collection(db, 'organizations'))
        const organizations = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            id: docSnap.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Organization
        })
        const filtered = activeOnly ? organizations.filter((org) => org.isActive) : organizations
        return filtered.sort((a, b) => a.order - b.order)
      } catch (fallbackError: any) {
        console.error('Error in fallback organizations query:', fallbackError)
        return []
      }
    }

    console.error('Error fetching organizations:', error)
    return []
  }
}

// ─── Incident Reports (WhatsApp evidence intake) ──────────────────────────────

export async function createIncidentReport(
  data: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const reportRef = doc(collection(db, 'incidentReports'))

  try {
    await setDoc(reportRef, {
      ...data,
      id: reportRef.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return reportRef.id
  } catch (error: any) {
    console.error('Error creating incident report:', error)
    throw error
  }
}

export async function updateIncidentReport(
  reportId: string,
  data: Partial<IncidentReport>
): Promise<void> {
  const updateData: any = { updatedAt: Timestamp.now() }

  if (data.messageId !== undefined) updateData.messageId = data.messageId
  if (data.whatsappMediaId !== undefined) updateData.whatsappMediaId = data.whatsappMediaId
  if (data.whatsappMediaUrl !== undefined) updateData.whatsappMediaUrl = data.whatsappMediaUrl
  if (data.mediaMimeType !== undefined) updateData.mediaMimeType = data.mediaMimeType
  if (data.mediaSha256 !== undefined) updateData.mediaSha256 = data.mediaSha256
  if (data.mediaFileSize !== undefined) updateData.mediaFileSize = data.mediaFileSize
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl
  if (data.storagePath !== undefined) updateData.storagePath = data.storagePath
  if (data.caption !== undefined) updateData.caption = data.caption
  if (data.description !== undefined) updateData.description = data.description
  if (data.status !== undefined) updateData.status = data.status
  if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage

  await updateDoc(doc(requireDb(), 'incidentReports', reportId), updateData)
}

// ─── Referral Operations ──────────────────────────────────────────────────────

/**
 * Generate a unique referral code (format: DCP-XXXXX where X is alphanumeric).
 * Checks Firestore to ensure uniqueness.
 */
export async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // avoid ambiguous chars 0/O, 1/I
  const generate = () => {
    let code = 'DCP-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const db = requireDb()
  // Try up to 5 times to find a unique code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generate()
    const q = query(collection(db, 'users'), where('referralCode', '==', code), limit(1))
    try {
      const snapshot = await getDocs(q)
      if (snapshot.empty) return code
    } catch {
      // If query fails (e.g. no index), just return the code – collision is extremely unlikely
      return code
    }
  }
  return generate() // fallback
}

/**
 * Look up a user by their referralCode.
 */
export async function getUserByReferralCode(referralCode: string): Promise<UserProfile | null> {
  if (!db) return null

  try {
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode), limit(1))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const data = snapshot.docs[0].data()
    return { ...data, uid: snapshot.docs[0].id, createdAt: toDate(data.createdAt) } as UserProfile
  } catch (error: any) {
    console.error('Error looking up user by referral code:', error)
    return null
  }
}

/**
 * Create a referral record when a referred user signs up.
 */
export async function createReferral(
  referral: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const refDoc = doc(collection(db, 'referrals'))

  try {
    const refData = {
      ...referral,
      id: refDoc.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    await setDoc(refDoc, refData)
    console.log('Referral created successfully:', refDoc.id)
    return refDoc.id
  } catch (error: any) {
    console.error('Error creating referral:', error)
    throw error
  }
}

/**
 * Get all referrals where the given user is the referrer.
 */
export async function getReferralsByUser(referrerUserId: string): Promise<Referral[]> {
  if (!db) return []

  try {
    const q = query(
      collection(db, 'referrals'),
      where('referrerUserId', '==', referrerUserId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Referral
    })
  } catch (error: any) {
    // Fallback without orderBy if index not ready
    if (error?.code === 'failed-precondition') {
      try {
        const q = query(collection(db, 'referrals'), where('referrerUserId', '==', referrerUserId))
        const snapshot = await getDocs(q)
        const referrals = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Referral
        })
        return referrals.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback referrals query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching referrals by user:', error)
    return []
  }
}

/**
 * Get the referral record for a referred user (the person who was invited).
 */
export async function getReferralByReferred(referredUserId: string): Promise<Referral | null> {
  if (!db) return null

  try {
    const q = query(
      collection(db, 'referrals'),
      where('referredUserId', '==', referredUserId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const data = snapshot.docs[0].data()
    return {
      ...data,
      id: snapshot.docs[0].id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Referral
  } catch (error: any) {
    console.error('Error fetching referral by referred user:', error)
    return null
  }
}

/**
 * Update the status of a referral (signed_up -> applied -> paid).
 */
export async function updateReferralStatus(
  referralId: string,
  status: ReferralStatus
): Promise<void> {
  const db = requireDb()
  await updateDoc(doc(db, 'referrals', referralId), {
    status,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Get all referrals (admin use).
 */
export async function getAllReferrals(): Promise<Referral[]> {
  if (!db) return []

  try {
    const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Referral
    })
  } catch (error: any) {
    if (error?.code === 'failed-precondition') {
      try {
        const snapshot = await getDocs(collection(db, 'referrals'))
        const referrals = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          } as Referral
        })
        return referrals.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
          const bDate = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
          return bDate - aDate
        })
      } catch (fallbackError: any) {
        console.error('Error in fallback all referrals query:', fallbackError)
        return []
      }
    }
    console.error('Error fetching all referrals:', error)
    return []
  }
}

// ===== Resource operations =====

export async function createResource(
  resource: Omit<Resource, 'id' | 'createdAt'>
): Promise<string> {
  const db = requireDb()
  const resourceRef = doc(collection(db, 'resources'))
  const resourceData: Record<string, any> = {
    title: resource.title,
    description: resource.description || '',
    fileName: resource.fileName,
    fileUrl: resource.fileUrl,
    storagePath: resource.storagePath,
    fileSize: resource.fileSize,
    uploadedBy: resource.uploadedBy,
    uploadedByName: resource.uploadedByName || '',
    id: resourceRef.id,
    createdAt: Timestamp.now(),
  }
  await setDoc(resourceRef, resourceData)
  return resourceRef.id
}

export async function getResources(): Promise<Resource[]> {
  const db = requireDb()
  try {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Resource))
  } catch (error) {
    console.error('Error fetching resources:', error)
    return []
  }
}

export async function deleteResource(resourceId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, 'resources', resourceId))
}

// ===== Download Tracking =====

export async function trackDownload(documentId: string, label?: string): Promise<void> {
  const db = requireDb()
  const ref = doc(db, 'analytics', documentId)

  try {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const updateData: Record<string, any> = {
        count: increment(1),
        lastDownloadedAt: Timestamp.now(),
      }
      if (label) updateData.label = label
      await updateDoc(ref, updateData)
    } else {
      await setDoc(ref, {
        id: documentId,
        label: label || documentId,
        count: 1,
        createdAt: Timestamp.now(),
        lastDownloadedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error('Error tracking download:', error)
  }
}

export async function getDownloadCount(documentId: string): Promise<number> {
  if (!db) return 0

  try {
    const snap = await getDoc(doc(db, 'analytics', documentId))
    if (snap.exists()) {
      return snap.data().count || 0
    }
    return 0
  } catch (error) {
    console.error('Error fetching download count:', error)
    return 0
  }
}

export interface DownloadStat {
  id: string
  label: string
  count: number
  createdAt: Date
  lastDownloadedAt: Date
}

export async function trackArticleView(articleId: string, articleTitle?: string): Promise<void> {
  const db = requireDb()
  const ref = doc(db, 'analytics', `article-${articleId}`)

  try {
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const updateData: Record<string, any> = {
        count: increment(1),
        lastViewedAt: Timestamp.now(),
      }
      if (articleTitle) updateData.label = articleTitle
      await updateDoc(ref, updateData)
    } else {
      await setDoc(ref, {
        id: `article-${articleId}`,
        label: articleTitle || articleId,
        type: 'article_view',
        count: 1,
        createdAt: Timestamp.now(),
        lastViewedAt: Timestamp.now(),
      })
    }
  } catch (error) {
    console.error('Error tracking article view:', error)
  }
}

export async function getArticleViewCount(articleId: string): Promise<number> {
  if (!db) return 0

  try {
    const snap = await getDoc(doc(db, 'analytics', `article-${articleId}`))
    if (snap.exists()) {
      return snap.data().count || 0
    }
    return 0
  } catch (error) {
    console.error('Error fetching article view count:', error)
    return 0
  }
}

// ===== Twitter Embeds =====

export async function createTwitterEmbed(
  embed: Omit<TwitterEmbedPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = requireDb()
  const embedRef = doc(collection(db, 'twitterEmbeds'))

  // If this embed is active, deactivate all others first
  if (embed.isActive) {
    const existing = await getDocs(query(collection(db, 'twitterEmbeds'), where('isActive', '==', true)))
    const batch = writeBatch(db)
    existing.docs.forEach(d => {
      batch.update(d.ref, { isActive: false, updatedAt: Timestamp.now() })
    })
    await batch.commit()
  }

  const embedData = {
    tweetUrl: embed.tweetUrl,
    label: embed.label || null,
    isActive: embed.isActive,
    createdBy: embed.createdBy,
    id: embedRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  await setDoc(embedRef, embedData)
  return embedRef.id
}

export async function getTwitterEmbeds(): Promise<TwitterEmbedPost[]> {
  const db = requireDb()
  try {
    const q = query(collection(db, 'twitterEmbeds'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as TwitterEmbedPost
    })
  } catch (error) {
    console.error('Error fetching twitter embeds:', error)
    return []
  }
}

export async function getPublicTwitterEmbeds(): Promise<TwitterEmbedPost[]> {
  if (!db) return []
  try {
    const q = query(collection(db, 'twitterEmbeds'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => {
      const data = d.data()
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as TwitterEmbedPost
    })
  } catch (error) {
    console.error('Error fetching public twitter embeds:', error)
    return []
  }
}

export async function getActiveTwitterEmbed(): Promise<TwitterEmbedPost | null> {
  if (!db) return null
  try {
    const q = query(
      collection(db, 'twitterEmbeds'),
      where('isActive', '==', true),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const d = snapshot.docs[0]
    const data = d.data()
    return {
      ...data,
      id: d.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as TwitterEmbedPost
  } catch (error) {
    console.error('Error fetching active twitter embed:', error)
    return null
  }
}

export async function updateTwitterEmbed(embedId: string, data: Partial<TwitterEmbedPost>): Promise<void> {
  const db = requireDb()

  // If activating, deactivate all others first
  if (data.isActive === true) {
    const existing = await getDocs(query(collection(db, 'twitterEmbeds'), where('isActive', '==', true)))
    const batch = writeBatch(db)
    existing.docs.forEach(d => {
      if (d.id !== embedId) {
        batch.update(d.ref, { isActive: false, updatedAt: Timestamp.now() })
      }
    })
    await batch.commit()
  }

  const updateData: Record<string, any> = { updatedAt: Timestamp.now() }
  if (data.tweetUrl !== undefined) updateData.tweetUrl = data.tweetUrl
  if (data.label !== undefined) updateData.label = data.label || null
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  await updateDoc(doc(db, 'twitterEmbeds', embedId), updateData)
}

export async function deleteTwitterEmbed(embedId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, 'twitterEmbeds', embedId))
}

export async function getAllDownloadStats(): Promise<DownloadStat[]> {
  if (!db) return []

  try {
    const snapshot = await getDocs(collection(db, 'analytics'))
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        label: data.label || docSnap.id,
        count: data.count || 0,
        createdAt: toDate(data.createdAt),
        lastDownloadedAt: toDate(data.lastDownloadedAt),
      }
    }).sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error fetching all download stats:', error)
    return []
  }
}

// ─── Inbound Emails ──────────────────────────────────────────────

export async function createInboundEmail(email: Omit<InboundEmail, 'id' | 'createdAt'>): Promise<string> {
  const db = requireDb()
  const ref = doc(collection(db, 'inboundEmails'))
  const payload: Record<string, any> = {
    from: email.from,
    to: email.to,
    subject: email.subject,
    body: email.body,
    isRead: email.isRead,
    isStarred: email.isStarred,
    createdAt: Timestamp.now(),
  }

  if (email.fromName !== undefined) payload.fromName = email.fromName
  if (email.html !== undefined) payload.html = email.html
  if (email.resendEmailId !== undefined) payload.resendEmailId = email.resendEmailId

  await setDoc(ref, payload)
  return ref.id
}

export async function getInboundEmails(limitCount: number = 100): Promise<InboundEmail[]> {
  const db = requireDb()
  const q = query(
    collection(db, 'inboundEmails'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt,
  })) as InboundEmail[]
}

export async function markInboundEmailRead(emailId: string): Promise<void> {
  const db = requireDb()
  await updateDoc(doc(db, 'inboundEmails', emailId), { isRead: true })
}

export async function markInboundEmailStarred(emailId: string, starred: boolean): Promise<void> {
  const db = requireDb()
  await updateDoc(doc(db, 'inboundEmails', emailId), { isStarred: starred })
}

export async function deleteInboundEmail(emailId: string): Promise<void> {
  const db = requireDb()
  await deleteDoc(doc(db, 'inboundEmails', emailId))
}
