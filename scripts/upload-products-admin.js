const admin = require('firebase-admin');

// Initialize with explicit project ID (will use application default credentials if available)
admin.initializeApp({
  projectId: 'zimdiasporavote',
});

const db = admin.firestore();
const { Timestamp } = admin.firestore;

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
  console.log('Starting to upload sample products...\n');
  
  const results = [];

  for (const product of sampleProducts) {
    try {
      const productRef = db.collection('products').doc();
      const now = Timestamp.now();
      const productData = {
        ...product,
        id: productRef.id,
        createdAt: now,
        updatedAt: now,
      };
      
      await productRef.set(productData);
      results.push({ success: true, name: product.name, id: productRef.id });
      console.log(`✅ Created: ${product.name} (ID: ${productRef.id})`);
    } catch (error) {
      results.push({ success: false, name: product.name, error: error.message });
      console.error(`❌ Error creating ${product.name}:`, error.message);
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✔ Upload complete! ${successCount} of ${sampleProducts.length} products uploaded.`);
  
  if (successCount < sampleProducts.length) {
    console.log('\nFailed products:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }
  
  process.exit(successCount === sampleProducts.length ? 0 : 1);
}

uploadProducts().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

