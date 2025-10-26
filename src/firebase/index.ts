import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

type FirebaseInstances = {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

// This function is now designed to be called separately on the client and server
// to ensure a valid Firebase instance is always available.
export function initializeFirebase(): FirebaseInstances {
  // On the server, we always want a new instance.
  // On the client, we want to reuse the existing instance.
  if (typeof window !== 'undefined' && getApps().length > 0) {
    const app = getApp();
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    return { app, firestore, auth };
  }

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  return { app, firestore, auth };
}
