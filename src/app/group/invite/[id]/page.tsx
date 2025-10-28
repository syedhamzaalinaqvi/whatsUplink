
import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getFirestore } from 'firebase/firestore';

function getDb() {
    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return getFirestore(app);
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const group = await getGroupById(db, params.id);
  
  if (!group) {
    notFound();
  }

  const relatedGroups = await getRelatedGroups(db, group);

  return <GroupDetailView group={group} relatedGroups={relatedGroups} />;
}

    