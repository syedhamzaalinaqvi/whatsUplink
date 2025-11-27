
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// This function initializes and returns the Firebase Admin SDK instance.
// It's memoized to ensure it only runs once per server instance.
let db: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;
let storage: admin.storage.Storage;

function initializeAdmin() {
  if (!getApps().length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
        storageBucket: firebaseConfig.storageBucket,
      });
      console.log('Firebase Admin SDK initialized.');
    } catch (error: any) {
      console.error('Firebase admin initialization error', error);
      // We are not throwing an error here to avoid crashing the server on initialization failures.
      // Functions calling this should handle the case where db/auth might not be available.
    }
  }
  
  if (!db) {
    db = admin.firestore();
  }
  if (!adminAuth) {
    adminAuth = admin.auth();
  }
  if (!storage) {
    storage = admin.storage();
  }

  return { db, adminAuth, storage };
};

// Export the function itself, not the result of calling it.
export { initializeAdmin as getFirebaseAdmin };
