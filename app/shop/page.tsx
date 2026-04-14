'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { getProducts, getProductById } from '@/lib/firebase/firestore'
import type { Product } from '@/types'

function FloatingCartIcon() {
  const { getTotalItems } = useCart()
  const cartItemCount = getTotalItems()

  if (cartItemCount === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed top-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:scale-110 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      aria-label="View cart"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {cartItemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
          {cartItemCount > 9 ? '9+' : cartItemCount}
        </span>
      )}
    </Link>
  )
}

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest'
type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

export default function ShopPage() {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 })
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setProductsLoading(true)
      const activeProducts = await getProducts(true)
      setProducts(activeProducts)
      
      // Calculate price range from products
      if (activeProducts.length > 0) {
        const prices = activeProducts.map(p => p.price)
        const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10 // Round up to nearest 10
        setPriceRange({ min: 0, max: maxPrice })
      }
      
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load products')
      console.error('Error loading products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products]

    // Apply stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => p.stock > 0)
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold)
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(p => p.stock === 0)
    }

    // Apply price range filter
    filtered = filtered.filter(p => p.price >= priceRange.min && p.price <= priceRange.max)

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'newest':
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toMillis?.() || 0
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toMillis?.() || 0
          return bTime - aTime
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }, [products, sortBy, stockFilter, priceRange])

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePurchase = async (product: Product) => {
    setError('')
    
    // Check if user is authenticated
    if (!user) {
      // Redirect to login page with return URL to shop
      router.push(`/login?returnUrl=${encodeURIComponent('/shop')}`)
      return
    }
    
    // Check stock availability
    if (product.stock <= 0) {
      setError('This product is out of stock')
      return
    }

    // Refresh product to get latest stock
    try {
      const latestProduct = await getProductById(product.id)
      if (!latestProduct || latestProduct.stock <= 0) {
        setError('This product is out of stock')
        await loadProducts() // Refresh the list
        return
      }
    } catch (err) {
      console.error('Error checking stock:', err)
    }

    setLoading(product.id)

    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: product.price,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          userName: user?.displayName || null,
          type: 'purchase',
          description: `Purchase: ${product.name}`,
          productId: product.id,
          productName: product.name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      // Redirect to payment page with client secret and product ID
      router.push(`/payment?client_secret=${data.clientSecret}&product=${encodeURIComponent(product.name)}&productId=${product.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to process purchase')
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Our Store</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Shop</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Filters and Sorting - Compact */}
        {!productsLoading && products.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low</option>
              <option value="price-desc">Price: High</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">$</span>
              <input
                type="number"
                min="0"
                max={priceRange.max}
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Min"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="number"
                min={priceRange.min}
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: Math.max(priceRange.min, parseInt(e.target.value) || priceRange.max) })}
                className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Max"
              />
            </div>

            {(stockFilter !== 'all' || priceRange.min > 0 || priceRange.max < 1000) && (
              <button
                onClick={() => {
                  setStockFilter('all')
                  if (products.length > 0) {
                    const prices = products.map(p => p.price)
                    const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10
                    setPriceRange({ min: 0, max: maxPrice })
                  }
                }}
                className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {productsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-slate-900 border-r-transparent"></div>
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">No products available.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500 mb-3">No products match your filters.</p>
            <button
              onClick={() => {
                setStockFilter('all')
                if (products.length > 0) {
                  const prices = products.map(p => p.price)
                  const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10
                  setPriceRange({ min: 0, max: maxPrice })
                }
              }}
              className="text-xs font-medium text-slate-900 hover:text-slate-700 transition-colors underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {currentProducts.map((product) => {
              const isOutOfStock = product.stock === 0
              const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="group rounded-lg border border-slate-200 bg-white overflow-hidden transition-all hover:border-slate-900 hover:shadow-md cursor-pointer"
                >
                  <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                        {product.stock} left
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="mb-1 text-sm font-bold line-clamp-1">{product.name}</h3>
                    <p className="mb-2 text-xs text-slate-500 line-clamp-2 h-8">{product.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold">${product.price.toFixed(2)}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                          }}
                          disabled={isOutOfStock}
                          className="rounded-md border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-50 hover:border-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Add to cart"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePurchase(product)
                          }}
                          disabled={loading === product.id || isOutOfStock}
                          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading === product.id ? '...' : isOutOfStock ? 'Out' : 'Buy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
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
                          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
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
                        <span key={page} className="px-1 text-xs text-slate-400">
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
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Floating Cart Icon */}
        <FloatingCartIcon />
      </div>
      </section>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 hover:bg-white transition-colors shadow-lg"
                aria-label="Close"
              >
                <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Product Image */}
                <div className="relative bg-slate-100 aspect-square md:aspect-auto md:min-h-[500px]">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                  {selectedProduct.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-6 sm:p-8 flex flex-col">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-4">{selectedProduct.name}</h2>
                    
                    <div className="mb-6">
                      {selectedProduct.stock > 0 && selectedProduct.stock <= selectedProduct.lowStockThreshold && (
                        <p className="text-sm font-medium text-yellow-600 mb-2">
                          Only {selectedProduct.stock} left!
                        </p>
                      )}
                      <p className="text-4xl font-bold text-slate-900 mb-4">
                        ${selectedProduct.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Description
                      </h3>
                      <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Stock Status
                      </h3>
                      <p className="text-base text-slate-700">
                        {selectedProduct.stock === 0
                          ? 'Out of Stock'
                          : selectedProduct.stock <= selectedProduct.lowStockThreshold
                          ? `Low Stock - ${selectedProduct.stock} available`
                          : `In Stock - ${selectedProduct.stock} available`}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto pt-6 border-t border-slate-200 space-y-3">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct)
                        setSelectedProduct(null)
                      }}
                      disabled={selectedProduct.stock === 0}
                      className="w-full rounded-lg border-2 border-slate-900 bg-white px-6 py-4 text-base font-semibold text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {selectedProduct.stock === 0 ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(null)
                        handlePurchase(selectedProduct)
                      }}
                      disabled={loading === selectedProduct.id || selectedProduct.stock === 0}
                      className="w-full rounded-lg bg-slate-900 px-6 py-4 text-base font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading === selectedProduct.id
                        ? 'Processing...'
                        : selectedProduct.stock === 0
                        ? 'Out of Stock'
                        : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* CTA Section */}

      {/* Footer */}
      <Footer />
    </main>
  )
}

