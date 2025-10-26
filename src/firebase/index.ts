import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

type FirebaseInstances = {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

let firebaseInstances: FirebaseInstances | null = null;

export function initializeFirebase(): FirebaseInstances {
  if (firebaseInstances) {
    return firebaseInstances;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  firebaseInstances = { app, firestore, auth };
  return firebaseInstances;
}
