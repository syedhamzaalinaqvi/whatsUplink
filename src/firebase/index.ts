import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

type FirebaseInstances = {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

// This function follows the recommended pattern for Next.js:
// Reuse the existing app instance on the client and in server-side environments
// to avoid re-initialization errors.
export function initializeFirebase(): FirebaseInstances {
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  return { app, firestore, auth };
}
