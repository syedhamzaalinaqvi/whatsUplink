
'use client';

import { FirebaseProvider } from './provider';

// This is a client-boundary component.
// It's purpose is to wrap the FirebaseProvider and any components that need it
// to ensure that the Firebase context is only used on the client.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
