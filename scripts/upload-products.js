const admin = require('firebase-admin');

// Initialize Firebase Admin
// Try to use application default credentials first
try {
  admin.initializeApp({
    projectId: 'zimdiasporavote',
  });
  console.log('✅ Firebase Admin initialized with application default credentials');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\nTo use this script, you need to:');
  console.log('1. Install Firebase CLI: npm install -g firebase-tools');
  console.log('2. Login: firebase login');
  console.log('3. Set application default credentials: firebase login:ci');
  process.exit(1);
}

const db = admin.firestore();

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
  
  const batch = db.batch();
  const results = [];

  for (const product of sampleProducts) {
    const productRef = db.collection('products').doc();
    const productData = {
      ...product,
      id: productRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    batch.set(productRef, productData);
    results.push({ name: product.name, id: productRef.id });
  }

  try {
    await batch.commit();
    console.log('✅ Successfully uploaded all products:\n');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (ID: ${result.id})`);
    });
    console.log('\n✔ Upload complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading products:', error.message);
    process.exit(1);
  }
}

uploadProducts();

