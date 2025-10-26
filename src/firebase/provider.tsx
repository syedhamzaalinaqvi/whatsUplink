'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { app, auth as clientAuth, firestore as clientFirestore } from './client';

interface FirebaseContextType {
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  auth: null,
  firestore: null,
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [services, setServices] = useState<FirebaseContextType>({ auth: null, firestore: null });

  useEffect(() => {
    // The instances are initialized in client.ts, so we can just set them here.
    // This ensures they are only accessed on the client-side.
    setServices({ auth: clientAuth, firestore: clientFirestore });
  }, []);

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
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
