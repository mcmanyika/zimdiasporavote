'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getMembershipByUser } from '@/lib/firebase/firestore'

export default function UserProfile() {
  const { user, userProfile, updateProfile } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [membershipTier, setMembershipTier] = useState<string>('free')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Sync fields with userProfile when it loads
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '')
      setPhone(userProfile.phone || '')
    }
  }, [userProfile])

  // Fetch actual membership tier from memberships collection
  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) return
      
      try {
        const membership = await getMembershipByUser(user.uid)
        if (membership && membership.status === 'succeeded') {
          setMembershipTier(membership.tier)
        } else {
          // Fall back to userProfile if no active membership
          setMembershipTier(userProfile?.membershipTier || 'free')
        }
      } catch (err) {
        console.error('Error fetching membership:', err)
        setMembershipTier(userProfile?.membershipTier || 'free')
      }
    }

    fetchMembership()

    // Refresh membership when component becomes visible (e.g., after returning from payment)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchMembership()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, userProfile?.membershipTier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    try {
      await updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || '',
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError(error.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Information</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update your account information
        </p>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:text-base"
          />
          <p className="mt-1 text-xs text-slate-500">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-base"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +263 77 123 4567"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

