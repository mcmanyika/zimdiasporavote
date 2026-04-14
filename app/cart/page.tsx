'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { getProductById } from '@/lib/firebase/firestore'

export default function CartPage() {
  const { user } = useAuth()
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    if (items.length === 0) return

    // Check if user is authenticated
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent('/cart')}`)
      return
    }

    setError('')
    setLoading(true)

    try {
      const totalAmount = getTotalPrice()
      const itemsDescription = items
        .map((item) => `${item.product.name} x${item.quantity}`)
        .join(', ')

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
          type: 'purchase',
          description: `Purchase: ${itemsDescription}`,
          cartItems: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      // Store cart items in sessionStorage to avoid URL length issues
      const cartItemsData = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image,
      }))
      sessionStorage.setItem('checkout_cart_items', JSON.stringify(cartItemsData))

      router.push(`/payment?client_secret=${data.clientSecret}`)
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Your Cart</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Shopping Cart</h1>
            </div>
          </div>
        </section>

        <section className="bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Your cart is empty</h2>
              <p className="mt-1 text-sm text-slate-500">Add some items to your cart to get started.</p>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Your Cart</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Shopping Cart</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{item.product.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{item.product.description}</p>
                        <p className="mt-2 text-lg font-bold text-slate-900">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="ml-4 text-slate-400 hover:text-slate-900 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <label className="text-sm font-medium text-slate-700">Quantity:</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm text-slate-600">Subtotal</p>
                        <p className="text-lg font-bold text-slate-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {item.product.stock <= item.product.lowStockThreshold && (
                      <p className="mt-2 text-xs font-medium text-yellow-600">
                        {item.product.stock === 0
                          ? 'Out of Stock'
                          : `Only ${item.product.stock} left!`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={clearCart}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-slate-200 bg-white p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading || items.length === 0}
                className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              <Link
                href="/shop"
                className="mt-4 block w-full text-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* CTA Section */}

      {/* Footer */}
      <Footer />
    </main>
  )
}

