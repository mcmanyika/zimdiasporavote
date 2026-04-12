'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { createNotification, getUserByReferralCode, createReferral, generateReferralCode } from '@/lib/firebase/firestore'
import type { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, name: string, referralCode?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: (referralCode?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        // Fetch user profile from Firestore
        if (!db) {
          setLoading(false)
          return
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            const profile = {
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as UserProfile

            // Auto-generate referral code for existing users who don't have one
            if (!profile.referralCode) {
              try {
                const newCode = await generateReferralCode()
                await setDoc(doc(db, 'users', user.uid), { referralCode: newCode }, { merge: true })
                profile.referralCode = newCode
              } catch (e) {
                console.warn('Could not auto-generate referral code:', e)
              }
            }

            setUserProfile(profile)
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              name: user.displayName || undefined,
              membershipTier: 'free',
              role: 'supporter',
              createdAt: new Date(),
              emailVerified: user.emailVerified,
              photoURL: user.photoURL || undefined,
            }
            try {
              await setDoc(doc(db, 'users', user.uid), {
                ...newProfile,
                createdAt: new Date(),
              })
              setUserProfile(newProfile)
            } catch (createError) {
              console.error('Error creating user profile:', createError)
              // Still set the profile in state even if Firestore write fails
              setUserProfile(newProfile)
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Set a minimal profile if fetch fails
          setUserProfile({
            uid: user.uid,
            email: user.email!,
            name: user.displayName || undefined,
            membershipTier: 'free',
            role: 'supporter',
            createdAt: new Date(),
            emailVerified: user.emailVerified,
            photoURL: user.photoURL || undefined,
          })
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string, referralCode?: string) => {
    if (!auth || !db) {
      throw new Error('Firebase is not initialized. Please configure your environment variables.')
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Send verification email
    await sendEmailVerification(user)

    // Look up referrer if a referral code was provided
    let referrerUser: UserProfile | null = null
    if (referralCode) {
      try {
        referrerUser = await getUserByReferralCode(referralCode)
      } catch { /* non-critical */ }
    }

    // Create user profile in Firestore
    const newReferralCode = await generateReferralCode()
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      name,
      membershipTier: 'free',
      role: 'supporter',
      createdAt: new Date(),
      emailVerified: false,
      referralCode: newReferralCode,
      ...(referrerUser ? { referredBy: referralCode } : {}),
    }

    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      createdAt: new Date(),
    })
    setUserProfile(userProfile)

    // Create referral record if referred by someone
    if (referrerUser) {
      try {
        await createReferral({
          referrerUserId: referrerUser.uid,
          referredUserId: user.uid,
          referredEmail: email,
          referredName: name,
          status: 'signed_up',
        })
      } catch (e) { /* non-critical */ }
    }

    // Create admin notification for new user signup
    try {
      await createNotification({
        type: 'new_user',
        title: 'New User Registration',
        message: `${name} (${email}) just signed up.${referrerUser ? ` Referred by ${referrerUser.name || referrerUser.email}.` : ''}`,
        link: '/dashboard/admin/users',
      })
    } catch (e) { /* non-critical */ }

    // Send automated welcome email (non-blocking, non-critical)
    try {
      fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, userId: user.uid }),
      }).catch(() => {}) // fire-and-forget
    } catch (e) { /* non-critical */ }
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase is not initialized. Please configure your environment variables.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async (referralCode?: string) => {
    if (!auth || !db) {
      throw new Error('Firebase is not initialized. Please configure your environment variables.')
    }
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Profile sync uses Firestore; keep Google Auth success even if rules/data fail so the user can still sign in.
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        // Look up referrer if a referral code was provided
        let referrerUser: UserProfile | null = null
        if (referralCode) {
          try {
            referrerUser = await getUserByReferralCode(referralCode)
          } catch { /* non-critical */ }
        }

        // Create new user profile with referral code
        const newReferralCode = await generateReferralCode()
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          name: user.displayName || undefined,
          membershipTier: 'free',
          role: 'supporter',
          createdAt: new Date(),
          emailVerified: user.emailVerified,
          photoURL: user.photoURL || undefined,
          referralCode: newReferralCode,
          ...(referrerUser ? { referredBy: referralCode } : {}),
        }
        await setDoc(doc(db, 'users', user.uid), {
          ...userProfile,
          createdAt: new Date(),
        })

        // Create referral record if referred by someone
        if (referrerUser) {
          try {
            await createReferral({
              referrerUserId: referrerUser.uid,
              referredUserId: user.uid,
              referredEmail: user.email!,
              referredName: user.displayName || user.email!,
              status: 'signed_up',
            })
          } catch (e) { /* non-critical */ }
        }

        // Create admin notification for new Google user signup
        try {
          await createNotification({
            type: 'new_user',
            title: 'New User Registration',
            message: `${user.displayName || user.email} signed up via Google.${referrerUser ? ` Referred by ${referrerUser.name || referrerUser.email}.` : ''}`,
            link: '/dashboard/admin/users',
          })
        } catch (e) { /* non-critical */ }

        // Send automated welcome email (non-blocking, non-critical)
        try {
          fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.displayName || user.email,
              userId: user.uid,
            }),
          }).catch(() => {}) // fire-and-forget
        } catch (e) { /* non-critical */ }
      }
    } catch (e: unknown) {
      const code = typeof e === 'object' && e !== null && 'code' in e ? (e as { code?: string }).code : undefined
      if (code === 'permission-denied') {
        console.error(
          'Firestore permission denied while syncing Google profile. Deploy firestore.rules to this Firebase project (npm run firebase:deploy:rules).',
          e
        )
        return
      }
      throw e
    }
  }

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase is not initialized. Please configure your environment variables.')
    }
    await signOut(auth)
    setUserProfile(null)
  }

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase is not initialized. Please configure your environment variables.')
    }
    await sendPasswordResetEmail(auth, email)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in')
    if (!db) {
      throw new Error('Firebase is not initialized. Please configure your environment variables.')
    }
    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null))
  }

  const refreshUserProfile = async () => {
    if (!user || !db) return
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserProfile({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as UserProfile)
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        resetPassword,
        updateProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

