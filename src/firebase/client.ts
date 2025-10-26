'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

console.log('Initializing Firebase...');

const firebaseConfig = {
    apiKey: "AIzaSyDLQyYe9Zv1cT_E4O_djxuDEHi_fLXPbXg",
    authDomain: "whatsapp-group-hub-4d4df.firebaseapp.com",
    projectId: "whatsapp-group-hub-4d4df",
    storageBucket: "whatsapp-group-hub-4d4df.appspot.com",
    messagingSenderId: "1069919260036",
    appId: "1:1069919260036:web:59867163df32cd0be4a1d1",
    measurementId: "G-SX5BBDHNR1"
};


let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized for the first time.');
  } else {
    app = getApp();
    console.log('Using existing Firebase app instance.');
  }

  auth = getAuth(app);
  firestore = getFirestore(app);
  console.log('Firestore and Auth services initialized successfully.');

} catch (e) {
  console.error("Firebase initialization error:", e);
  // Re-throw the error if you want to handle it further up the component tree
  // or just log it to understand the issue without crashing the app.
}


async function getFirestoreInstance(): Promise<Firestore> {
  if (!firestore) {
    console.error("Firestore is not initialized!");
    // This should ideally not happen if the above logic is correct
    // but as a fallback, we can try to initialize it again.
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    firestore = getFirestore(app);
  }
  return firestore;
}

export { app, auth, firestore, getFirestoreInstance };
