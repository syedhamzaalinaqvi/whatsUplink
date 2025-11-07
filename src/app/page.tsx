
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from '@/lib/admin-settings';
import { getCategories, getCountries, seedInitialData } from '@/app/admin/actions';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
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

export default async function Home() {
  // Fetch settings and taxonomies on the server.
  const [settings, categories, countries] = await Promise.all([
    getModerationSettings(),
    getCategories(),
    getCountries()
  ]);

  // Seed initial data if necessary.
  await seedInitialData();

  // Fetch all groups on the server.
  const db = getFirestoreInstance();
  const groupsQuery = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
  const groupSnapshot = await getDocs(groupsQuery);
  const allGroups = groupSnapshot.docs.map(g => {
    const group = mapDocToGroupLink(g);
    group.showClicks = settings.showClicks; // Ensure global setting is applied
    return group;
  });

  // Pass the server-fetched data to the client component.
  // The client component will handle filtering and displaying the data.
  return (
    <HomePage 
      initialSettings={settings}
      allGroups={allGroups}
      initialCategories={categories}
      initialCountries={countries}
    />
  );
}
