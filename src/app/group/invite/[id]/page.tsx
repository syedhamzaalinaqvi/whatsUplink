
import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
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
