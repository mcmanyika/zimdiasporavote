import { NextRequest, NextResponse } from 'next/server'
import { createProduct } from '@/lib/firebase/firestore'

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

export async function POST(request: NextRequest) {
  try {
    const results = []
    
    for (const product of sampleProducts) {
      try {
        const productId = await createProduct(product)
        results.push({ success: true, product: product.name, id: productId })
      } catch (error: any) {
        results.push({ success: false, product: product.name, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    
    return NextResponse.json({
      message: `Uploaded ${successCount} of ${sampleProducts.length} products`,
      results,
    })
  } catch (error: any) {
    console.error('Error uploading products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload products' },
      { status: 500 }
    )
  }
}

