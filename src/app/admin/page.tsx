import { getCategories, getCountries, seedInitialData, getLayoutSettings, getReports } from './actions';
import { getModerationSettings } from '@/lib/admin-settings';
import { notFound } from 'next/navigation';
import { AdminPageClient } from './admin-page-client';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { mapDocToGroupLink } from '@/lib/data';


// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    const { getFirestore } = require('firebase/firestore');
    return getFirestore(app);
}


export default async function AdminPage() {
  try {
    await seedInitialData();
    
    // We fetch the initial batch of groups here for the first render.
    // The client component will then take over with real-time updates.
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
