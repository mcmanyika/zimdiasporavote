import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { createProduct } from '../lib/firebase/firestore'

// Firebase config - using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

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

async function uploadProducts() {
  console.log('Starting to upload sample products...')
  
  for (const product of sampleProducts) {
    try {
      const productId = await createProduct(product)
      console.log(`✅ Created product: ${product.name} (ID: ${productId})`)
    } catch (error: any) {
      console.error(`❌ Error creating product ${product.name}:`, error.message)
    }
  }
  
  console.log('Finished uploading products!')
  process.exit(0)
}

uploadProducts().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

