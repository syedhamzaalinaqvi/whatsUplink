
import * as admin from 'firebase-admin';

// This function initializes and returns the Firebase Admin SDK app instance.
// It ensures that the app is initialized only once (singleton pattern).
export function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (!serviceAccount) {
    throw new Error(
      'Firebase service account credentials are not set in the environment variables.'
    );
  }
  
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return app;
}

    
