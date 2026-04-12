'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import DashboardNav from '@/app/components/DashboardNav'
import Link from 'next/link'
import { createProduct } from '@/lib/firebase/firestore'
import { useRouter } from 'next/navigation'

const sampleProducts = [
  {
    name: 'Diaspora Vote T-Shirt',
    description: 'Show your support with our official platform t-shirt',
    price: 25,
    image: '/images/store/tshirt.png',
    stock: 50,
    lowStockThreshold: 10,
    isActive: true,
  },
  {
    name: 'Diaspora Vote Sticker Pack',
    description: 'Set of 5 high-quality vinyl stickers',
    price: 5,
    image: '/images/store/cap.png',
    stock: 100,
    lowStockThreshold: 20,
    isActive: true,
  },
  {
    name: 'Diaspora Vote Flag',
    description: '3x5 foot flag for rallies and events',
    price: 35,
    image: '/images/store/hoodie.png',
    stock: 30,
    lowStockThreshold: 10,
    isActive: true,
  },
  {
    name: 'Constitutional Guide',
    description: 'Educational guide on constitutional principles',
    price: 15,
    image: '/images/store/hoodie-girl.png',
    stock: 75,
    lowStockThreshold: 15,
    isActive: true,
  },
]

export default function UploadProductsPage() {
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<Array<{ success: boolean; name: string; id?: string; error?: string }>>([])
  const router = useRouter()

  const handleUpload = async () => {
    setUploading(true)
    setResults([])

    const uploadResults = []
    for (const product of sampleProducts) {
      try {
        const productId = await createProduct(product)
        uploadResults.push({ success: true, name: product.name, id: productId })
      } catch (error: any) {
        uploadResults.push({ success: false, name: product.name, error: error.message })
      }
    }

    setResults(uploadResults)
    setUploading(false)
  }

  return (
    <ProtectedRoute>
      <AdminRoute>
        <div className="min-h-screen bg-slate-50">
          <div className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Upload Sample Products</h1>
                <Link
                  href="/dashboard/admin/products"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  ← Back to Products
                </Link>
              </div>
            </div>
          </div>

          <DashboardNav />

          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-bold">Sample Products</h2>
              <p className="mb-6 text-slate-600">
                Click the button below to upload 4 sample products to Firestore.
              </p>

              <div className="mb-6 space-y-2">
                {sampleProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-slate-600">${product.price} • Stock: {product.stock}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload All Products'}
              </button>

              {results.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold">Upload Results:</h3>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 ${
                        result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {result.success ? (
                        <p>
                          ✅ {result.name} - Created (ID: {result.id})
                        </p>
                      ) : (
                        <p>
                          ❌ {result.name} - Error: {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                  {results.every(r => r.success) && (
                    <div className="mt-4">
                      <Link
                        href="/dashboard/admin/products"
                        className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        View Products
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminRoute>
    </ProtectedRoute>
  )
}

