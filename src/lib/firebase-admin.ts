import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Decode the base64-encoded service account key from environment variables
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in the environment variables.');
}

const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(decodedKey);

// Initialize the Firebase Admin SDK if it hasn't been already
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
}

// Export the initialized Firestore instance for use in server-side actions
const adminDb = getFirestore();

export { adminDb };

    