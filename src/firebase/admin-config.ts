
import * as admin from 'firebase-admin';

// This function initializes and returns the Firebase Admin SDK app instance.
// It ensures that the app is initialized only once (singleton pattern).
export function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }
  
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountString) {
    throw new Error(
      'Firebase service account credentials are not set in the environment variables.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    
    // The private key from env vars has '\\n' which needs to be replaced with actual newlines.
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    return app;

  } catch (e: any) {
    console.error("Failed to parse or initialize Firebase Admin SDK:", e);
    // Rethrow a more specific error to help with debugging
    if (e.message.includes('private key')) {
        throw new Error(`Failed to parse private key: ${e.message}`);
    }
    throw new Error(`Failed to initialize Firebase Admin: ${e.message}`);
  }
}
