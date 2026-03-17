'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute({
  children,
  minAccessLevel = 1,
}: {
  children: React.ReactNode
  minAccessLevel?: number
}) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const hasRequiredAccess = (userProfile?.accessLevel || 1) >= minAccessLevel

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (userProfile?.role !== 'admin') {
        router.push('/dashboard')
      } else if (!hasRequiredAccess) {
        router.push('/dashboard')
      }
    }
  }, [user, userProfile, loading, hasRequiredAccess, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || userProfile?.role !== 'admin' || !hasRequiredAccess) {
    return null
  }

  return <>{children}</>
}

