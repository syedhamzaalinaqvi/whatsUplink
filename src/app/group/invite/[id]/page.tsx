
import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getFirestore } from 'firebase/firestore';
import { getCategories, getCountries } from '@/app/admin/actions';

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
  
  // Fetch all required data in parallel
  const [group, relatedGroups, categories, countries] = await Promise.all([
    getGroupById(db, params.id),
    getRelatedGroups(db, params.id), // Pass ID to fetch related groups based on initial group
    getCategories(),
    getCountries()
  ]);
  
  if (!group) {
    notFound();
  }

  // Refetch related groups if the initial call depended on group data not yet available.
  // This is a common pattern when one async call depends on another.
  const finalRelatedGroups = await getRelatedGroups(db, group);

  return (
    <GroupDetailView 
      group={group} 
      relatedGroups={finalRelatedGroups} 
      categories={categories}
      countries={countries}
    />
  );
}
