'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import DashboardNav from '@/app/components/DashboardNav'
import MembershipCard from '@/app/components/MembershipCard'
import { useAuth } from '@/contexts/AuthContext'
import { getPurchasesByUser, getProductById, getAllUsers, getNews, getPetitions, getProducts, getAllPurchases, getAllVolunteerApplications, getAllDonations, getMembershipApplications } from '@/lib/firebase/firestore'
import type { Purchase, Product, UserProfile as UserProfileType, News, Petition, Donation, VolunteerApplication, MembershipApplication } from '@/types'
import Link from 'next/link'
import AdminCharts from '@/app/components/AdminCharts'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>

        <DashboardNav />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <DashboardContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}

function toDate(date: Date | any): Date | null {
  if (!date) return null
  if (date instanceof Date) return date
  if (date && typeof date === 'object' && 'toDate' in date) {
    return (date as any).toDate()
  }
  return new Date(date as string | number)
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

type SortOption = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc' | 'name-asc' | 'name-desc'
type StatusFilter = 'all' | 'succeeded' | 'pending' | 'failed' | 'canceled'

function DashboardContent() {
  const { user, userProfile } = useAuth()
  const [membershipTier, setMembershipTier] = useState<string>('free')
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [purchasesLoading, setPurchasesLoading] = useState(true)
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [productImages, setProductImages] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const purchasesPerPage = 5
  const [siteStats, setSiteStats] = useState<{
    totalUsers: number
    totalArticles: number
    totalPetitions: number
    totalProducts: number
    totalOrders: number
    totalDonations: number
    totalVolunteers: number
    totalRevenue: number
  } | null>(null)
  const [rawData, setRawData] = useState<{
    users: UserProfileType[]
    articles: News[]
    petitions: Petition[]
    purchases: Purchase[]
    donations: Donation[]
    volunteers: VolunteerApplication[]
    membershipApplications: MembershipApplication[]
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch site stats for admin
  useEffect(() => {
    if (userProfile?.role !== 'admin') return

    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const [users, articles, petitions, products, orders, donations, volunteers, membershipApps] = await Promise.all([
          getAllUsers(),
          getNews(false),
          getPetitions(false, false),
          getProducts(),
          getAllPurchases(),
          getAllDonations(),
          getAllVolunteerApplications(),
          getMembershipApplications(),
        ])

        const orderRevenue = orders
          .filter(o => o.status === 'succeeded')
          .reduce((sum, o) => sum + o.amount, 0)

        const donationRevenue = donations
          .filter(d => d.status === 'succeeded')
          .reduce((sum, d) => sum + d.amount, 0)

        const totalRevenue = orderRevenue + donationRevenue

        setSiteStats({
          totalUsers: users.length,
          totalArticles: articles.length,
          totalPetitions: petitions.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalDonations: donations.length,
          totalVolunteers: volunteers.length,
          totalRevenue,
        })
        setRawData({
          users,
          articles,
          petitions,
          purchases: orders,
          donations,
          volunteers,
          membershipApplications: membershipApps,
        })
      } catch (err) {
        console.error('Error fetching site stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [userProfile?.role])

  useEffect(() => {
    // Fetch membership to get the actual tier
    const fetchMembership = async () => {
      if (!user) return
      
      try {
        const { getMembershipByUser } = await import('@/lib/firebase/firestore')
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
  }, [user, userProfile?.membershipTier])

  useEffect(() => {
    // Fetch purchases and product images
    const fetchPurchases = async () => {
      if (!user) {
        setPurchasesLoading(false)
        return
      }

      setPurchasesLoading(true)
      try {
        const data = await getPurchasesByUser(user.uid)
        setPurchases(data)

        // Fetch product images for all purchases
        const imageMap: Record<string, string> = {}
        for (const purchase of data) {
          if (purchase.productId && !imageMap[purchase.productId]) {
            try {
              const product = await getProductById(purchase.productId)
              if (product?.image) {
                imageMap[purchase.productId] = product.image
              }
            } catch (err) {
              console.error(`Error fetching product ${purchase.productId}:`, err)
            }
          }
        }
        setProductImages(imageMap)
      } catch (err: any) {
        console.error('Error fetching purchases:', err)
        setPurchases([])
      } finally {
        setPurchasesLoading(false)
      }
    }

    fetchPurchases()
  }, [user])

  // Filter and sort purchases
  useEffect(() => {
    let filtered = [...purchases]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const aTime = toDate(a.createdAt)?.getTime() || 0
          const bTime = toDate(b.createdAt)?.getTime() || 0
          return bTime - aTime
        case 'oldest':
          const aTimeOld = toDate(a.createdAt)?.getTime() || 0
          const bTimeOld = toDate(b.createdAt)?.getTime() || 0
          return aTimeOld - bTimeOld
        case 'amount-desc':
          return b.amount - a.amount
        case 'amount-asc':
          return a.amount - b.amount
        case 'name-asc':
          return a.productName.localeCompare(b.productName)
        case 'name-desc':
          return b.productName.localeCompare(a.productName)
        default:
          return 0
      }
    })

    setFilteredPurchases(filtered)
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }, [purchases, sortBy, statusFilter, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredPurchases.length / purchasesPerPage)
  const startIndex = (currentPage - 1) * purchasesPerPage
  const endIndex = startIndex + purchasesPerPage
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Welcome + Membership row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 items-stretch">
        {/* Welcome Back Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{userProfile?.name || 'Welcome'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Membership Card */}
        <div className="flex flex-col h-full">
          <MembershipCard />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/#donate"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-center transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Donate</span>
          </Link>
          <Link
            href="/dashboard/membership"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-center transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Membership</span>
          </Link>
          <Link
            href="/volunteer"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-center transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Volunteer</span>
          </Link>
          <Link
            href="/shop"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3.5 text-center transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-700">Shop</span>
          </Link>
        </div>
      </div>

      {/* Admin Site Stats */}
      {userProfile?.role === 'admin' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-bold">Site Stats</h2>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-slate-900 border-r-transparent"></div>
            </div>
          ) : siteStats ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              <Link href="/dashboard/admin/users" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-slate-900">{siteStats.totalUsers}</p>
                <p className="text-xs text-slate-500 mt-1">Users</p>
              </Link>
              <Link href="/dashboard/admin/news" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-slate-900">{siteStats.totalArticles}</p>
                <p className="text-xs text-slate-500 mt-1">Articles</p>
              </Link>
              <Link href="/dashboard/admin/petitions" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-slate-900">{siteStats.totalPetitions}</p>
                <p className="text-xs text-slate-500 mt-1">Petitions</p>
              </Link>
              <Link href="/dashboard/admin/products" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-slate-900">{siteStats.totalProducts}</p>
                <p className="text-xs text-slate-500 mt-1">Products</p>
              </Link>
              <Link href="/dashboard/admin/orders" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-slate-900">{siteStats.totalOrders}</p>
                <p className="text-xs text-slate-500 mt-1">Orders</p>
              </Link>
              <Link href="/dashboard/admin/donations" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-emerald-600">{siteStats.totalDonations}</p>
                <p className="text-xs text-slate-500 mt-1">Donations</p>
              </Link>
              <Link href="/dashboard/admin/volunteers" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-slate-900">{siteStats.totalVolunteers}</p>
                <p className="text-xs text-slate-500 mt-1">Volunteers</p>
              </Link>
              <Link href="/dashboard/admin/orders" className="rounded-lg bg-slate-50 p-4 text-center transition-colors hover:bg-slate-100">
                <p className="text-2xl font-bold text-green-700">${siteStats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Revenue</p>
              </Link>
            </div>
          ) : null}

          {/* Charts */}
          {rawData && (
            <div className="mt-6">
              <AdminCharts
                users={rawData.users}
                articles={rawData.articles}
                petitions={rawData.petitions}
                purchases={rawData.purchases}
                donations={rawData.donations}
                volunteers={rawData.volunteers}
                membershipApplications={rawData.membershipApplications}
              />
            </div>
          )}
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Orders</h2>
          {purchases.length > 0 && (
            <Link
              href="/dashboard/orders"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              View All
            </Link>
          )}
        </div>

        {purchasesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
              <p className="text-slate-600">Loading orders...</p>
            </div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-600 mb-4">No orders yet</p>
            <Link
              href="/shop"
              className="inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Visit Shop
            </Link>
          </div>
        ) : (
          <>
            {/* Filters and Sorting */}
            <div className="mb-4 space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="all">All Status</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            {filteredPurchases.length > 0 && (
              <p className="mb-4 text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPurchases.length)} of {filteredPurchases.length} order{filteredPurchases.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Orders List */}
            {filteredPurchases.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-600">No orders match your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setSortBy('newest')
                  }}
                  className="mt-4 text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentPurchases.map((purchase) => {
                    const purchaseDate = toDate(purchase.createdAt)
                    const productImage = productImages[purchase.productId] || '/images/placeholder.png'
                    return (
                      <div
                        key={purchase.id}
                        className="grid grid-cols-5 gap-3 items-center rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                      >
                        {/* Product Image */}
                        <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          <img
                            src={productImage}
                            alt={purchase.productName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/images/placeholder.png'
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-slate-900 truncate">{purchase.productName}</h3>
                          {purchase.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{purchase.description}</p>
                          )}
                        </div>

                        {/* Purchase Date */}
                        <div className="text-xs text-slate-600">
                          <p className="font-medium text-slate-500 text-[10px] mb-0.5">Purchase Date</p>
                          <p>{formatDate(purchaseDate)}</p>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="font-medium text-slate-500 text-[10px] mb-1">Status</p>
                          <div
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              purchase.status === 'succeeded'
                                ? 'bg-green-100 text-green-700'
                                : purchase.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {purchase.status}
                          </div>
                          {purchase.shipmentStatus && (
                            <div className="mt-1">
                              <div
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  purchase.shipmentStatus === 'delivered'
                                    ? 'bg-green-100 text-green-700'
                                    : purchase.shipmentStatus === 'shipped'
                                    ? 'bg-purple-100 text-purple-700'
                                    : purchase.shipmentStatus === 'processing'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {purchase.shipmentStatus}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-semibold text-sm text-slate-900">
                            ${purchase.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-slate-900 text-white'
                                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-1 text-sm text-slate-400">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

