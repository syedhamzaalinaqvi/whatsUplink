
import { getCategories, getCountries, seedInitialData, getLayoutSettings, getReports } from './actions';
import { getModerationSettings } from '@/lib/admin-settings';
import { notFound } from 'next/navigation';
import { AdminPageClient } from './admin-page-client';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { mapDocToGroupLink } from '@/lib/data';


// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}


export default async function AdminPage() {
  // Setting revalidate to 0 tells Next.js not to cache this page,
  // so data is always fresh on navigation.
  // This is an alternative to calling revalidatePath from every action.
  // export const revalidate = 0; 

  try {
    await seedInitialData();
    
    const db = getFirestoreInstance();
    const groupsQuery = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    const initialGroupSnapshot = await getDocs(groupsQuery);
    const initialGroups = initialGroupSnapshot.docs.map(mapDocToGroupLink);
    
    const [moderationSettings, categories, countries, layoutSettings, reports] = await Promise.all([
      getModerationSettings(),
      getCategories(),
      getCountries(),
      getLayoutSettings(),
      getReports(),
    ]);

    return (
      <AdminPageClient
        initialGroups={initialGroups}
        initialModerationSettings={moderationSettings}
        initialCategories={categories}
        initialCountries={countries}
        initialLayoutSettings={layoutSettings}
        initialReports={reports}
      />
    );
  } catch (error) {
    console.error('Failed to load admin data:', error);
    return notFound();
  }
}
