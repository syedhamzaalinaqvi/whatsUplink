'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [services, setServices] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      setServices({ app, auth, firestore });
      console.log('Firebase services are ready.');
    } catch (e) {
        console.error("Firebase initialization error:", e);
        setServices(null);
    }
  }, []);

  // Only render children when firebase services are available to avoid null context issues
  return (
    <FirebaseContext.Provider value={services}>
      {services ? children : null /* Or a loading indicator */}
    </FirebaseContext.Provider>
  );
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirestore must be used within a FirebaseProvider and after initialization');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useAuth must be used within a FirebaseProvider and after initialization');
  }
  return context;
};
