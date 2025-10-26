'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [services, setServices] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    firestore: null,
  });

  useEffect(() => {
    try {
      if (getApps().length === 0) {
        console.log('Initializing Firebase...');
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        console.log('Firebase initialized successfully.');
        setServices({ app, auth, firestore });
      } else {
        console.log('Using existing Firebase app.');
        const app = getApp();
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        setServices({ app, auth, firestore });
      }
    } catch (e) {
        console.error("Firebase initialization error:", e);
        setServices({ app: null, auth: null, firestore: null });
    }
  }, []);

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
