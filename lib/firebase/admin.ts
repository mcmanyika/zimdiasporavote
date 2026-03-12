import { App, applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { randomUUID } from 'crypto'

let adminApp: App | null = null

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
    }
    return parsed
  } catch (error) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error)
    return null
  }
}

function getAdminApp(): App {
  if (adminApp) return adminApp
  if (getApps().length > 0) {
    adminApp = getApps()[0]!
    return adminApp
  }

  const serviceAccount = getServiceAccount()
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
      storageBucket,
    })
  } else {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    })
  }

  return adminApp
}

function getBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!bucketName) {
    throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not configured')
  }
  return getStorage(getAdminApp()).bucket(bucketName)
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}

export async function uploadBufferToStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<{ storagePath: string; downloadUrl: string }> {
  const bucket = getBucket()
  const file = bucket.file(storagePath)
  const token = randomUUID()

  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  })

  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`
  return { storagePath, downloadUrl }
}

