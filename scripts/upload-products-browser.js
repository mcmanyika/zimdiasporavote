// Run this script in the browser console while logged in as an admin
// Navigate to: http://localhost:3000/dashboard/admin/products
// Then paste this script in the browser console

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
];

async function uploadProducts() {
  const { createProduct } = await import('/lib/firebase/firestore');
  
  console.log('Starting to upload products...');
  
  for (const product of sampleProducts) {
    try {
      const productId = await createProduct(product);
      console.log(`✅ Created: ${product.name} (ID: ${productId})`);
    } catch (error) {
      console.error(`❌ Error creating ${product.name}:`, error);
    }
  }
  
  console.log('Upload complete!');
}

uploadProducts();

