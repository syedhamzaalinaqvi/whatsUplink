
import { MetadataRoute } from 'next';
import { collection, getDocs, query, select } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { GroupLink } from '@/lib/data';

function getDb() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://whatsuplink.online';

  const staticRoutes = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/submit',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));
  
  const db = getDb();
  // Optimize the query to only fetch the document ID, which is all we need.
  // This is much faster and uses significantly less data than fetching the whole document.
  const groupsQuery = query(collection(db, 'groups'), select()); // select() with no arguments fetches only IDs
  const querySnapshot = await getDocs(groupsQuery);
  const groupIds = querySnapshot.docs.map(doc => doc.id);

  const dynamicRoutes = groupIds.map((id) => ({
    url: `${baseUrl}/group/invite/${id}`,
    lastModified: new Date().toISOString(), // lastModified can't be determined without a full fetch, so we use the current date.
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
