
import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
  if (!getApps().length) {
    return getFirestore(initializeApp({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
    }));
  }
  return getFirestore();
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const firestore = getFirestoreInstance();
  const group = await getGroupById(firestore, params.id);
  
  if (!group) {
    notFound();
  }

  const relatedGroups = await getRelatedGroups(firestore, group);

  return <GroupDetailView group={group} relatedGroups={relatedGroups} />;
}
