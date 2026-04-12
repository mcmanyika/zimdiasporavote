'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserCart, saveUserCart, clearUserCart } from '@/lib/firebase/firestore'
import type { CartItem, Product } from '@/types'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'dv_cart'
const LEGACY_CART_KEY = 'dcp_cart'

function readCartFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null
  const next = localStorage.getItem(CART_STORAGE_KEY)
  if (next) return next
  const legacy = localStorage.getItem(LEGACY_CART_KEY)
  if (legacy) {
    localStorage.setItem(CART_STORAGE_KEY, legacy)
    localStorage.removeItem(LEGACY_CART_KEY)
    return legacy
  }
  return null
}

function clearCartLocalStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
  localStorage.removeItem(LEGACY_CART_KEY)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const isSyncingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  // Load cart from localStorage immediately on mount (before auth loads)
  useEffect(() => {
    if (hasLoadedRef.current || typeof window === 'undefined') return
    
    try {
      const savedCart = readCartFromLocalStorage()
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        setItems(parsedCart)
      }
      setIsLoaded(true)
      hasLoadedRef.current = true
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      setIsLoaded(true)
      hasLoadedRef.current = true
    }
  }, [])

  // Load cart from Firestore when auth is ready and user is logged in
  useEffect(() => {
    if (authLoading || !user || isSyncingRef.current) return
    
    const loadCartFromFirestore = async () => {
      try {
        isSyncingRef.current = true
        const firestoreCart = await getUserCart(user.uid)
        
        // Also check localStorage for items added before login
        let localCart: CartItem[] = []
        if (typeof window !== 'undefined') {
          try {
            const savedCart = readCartFromLocalStorage()
            if (savedCart) {
              localCart = JSON.parse(savedCart)
            }
          } catch (error) {
            console.error('Error loading local cart:', error)
          }
        }

        // Merge carts: combine items, preferring Firestore quantities for duplicates
        const mergedCart: CartItem[] = []
        const productMap = new Map<string, CartItem>()

        // Add Firestore items first (these take precedence)
        firestoreCart.forEach(item => {
          productMap.set(item.productId, item)
          mergedCart.push(item)
        })

        // Add local items that aren't in Firestore
        localCart.forEach(localItem => {
          if (!productMap.has(localItem.productId)) {
            mergedCart.push(localItem)
          }
        })

        setItems(mergedCart)
        
        // Save merged cart to Firestore and clear localStorage
        if (mergedCart.length > 0) {
          await saveUserCart(user.uid, mergedCart)
          if (typeof window !== 'undefined') {
            clearCartLocalStorage()
          }
        } else {
          // Clear localStorage if cart is empty
          if (typeof window !== 'undefined') {
            clearCartLocalStorage()
          }
        }
      } catch (error) {
        console.error('Error loading cart from Firestore:', error)
        // Keep localStorage cart if Firestore fails
      } finally {
        isSyncingRef.current = false
      }
    }

    loadCartFromFirestore()
  }, [user, authLoading])

  // Save cart to Firestore (if user is logged in) or localStorage (if not)
  useEffect(() => {
    if (!isLoaded || isSyncingRef.current || authLoading) return

    const saveCart = async () => {
      if (user) {
        // User is logged in - save to Firestore
        try {
          isSyncingRef.current = true
          await saveUserCart(user.uid, items)
          // Clear localStorage when user is logged in
          if (typeof window !== 'undefined') {
            clearCartLocalStorage()
          }
        } catch (error) {
          console.error('Error saving cart to Firestore:', error)
          // Fallback to localStorage if Firestore fails
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
            } catch (e) {
              console.error('Error saving cart to localStorage:', e)
            }
          }
        } finally {
          isSyncingRef.current = false
        }
      } else {
        // No user - save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
          } catch (error) {
            console.error('Error saving cart to localStorage:', error)
          }
        }
      }
    }

    saveCart()
  }, [items, isLoaded, user, authLoading])

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id)

      if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = existingItem.quantity + quantity
        if (newQuantity > product.stock) {
          alert(`Only ${product.stock} items available in stock`)
          return prevItems
        }
        return prevItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        // Add new item
        if (quantity > product.stock) {
          alert(`Only ${product.stock} items available in stock`)
          return prevItems
        }
        return [...prevItems, { productId: product.id, product, quantity }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((prevItems) => {
      const item = prevItems.find((item) => item.productId === productId)
      if (!item) return prevItems

      if (quantity > item.product.stock) {
        alert(`Only ${item.product.stock} items available in stock`)
        return prevItems
      }

      return prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    })
  }

  const clearCart = async () => {
    setItems([])
    if (user) {
      try {
        await clearUserCart(user.uid)
      } catch (error) {
        console.error('Error clearing cart from Firestore:', error)
      }
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

