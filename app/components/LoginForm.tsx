'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(formData.email, formData.password)
      router.push(returnUrl)
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to sign in'
      
      // Provide user-friendly error messages
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        errorMessage = 'Firebase is not configured. Please check your environment variables in .env.local'
      } else if (err.code === 'auth/invalid-api-key' || err.message?.includes('invalid-api-key')) {
        errorMessage = 'Invalid Firebase API key. Please check your .env.local file'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.'
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email.'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      } else if (err.code === 'permission-denied' || err.message?.includes('insufficient permissions')) {
        errorMessage =
          'Database access was denied. Deploy Firestore security rules to your Firebase project (npm run firebase:deploy:rules), or confirm NEXT_PUBLIC_FIREBASE_PROJECT_ID matches the project where rules are deployed.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push(returnUrl)
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to sign in with Google'
      
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        errorMessage = 'Firebase is not configured. Please check your environment variables in .env.local'
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled. Please try again.'
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.'
      } else if (err.code === 'permission-denied' || err.message?.includes('insufficient permissions')) {
        errorMessage =
          'Database access was denied. Deploy Firestore security rules to your Firebase project (npm run firebase:deploy:rules), or confirm NEXT_PUBLIC_FIREBASE_PROJECT_ID matches the project where rules are deployed.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-base"
        />
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-base"
        />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/forgot-password"
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignin}
        disabled={loading}
        className="w-full rounded-lg border-2 border-slate-300 px-6 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </form>
  )
}

