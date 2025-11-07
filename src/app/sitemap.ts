
import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

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
  // Fetch all documents. The select() optimization was incorrect for the client SDK.
  // A full getDocs() is necessary here, but should be fast enough given other recent optimizations.
  const groupsQuery = query(collection(db, 'groups'));
  const querySnapshot = await getDocs(groupsQuery);
  const groupIds = querySnapshot.docs.map(doc => doc.id);

  const dynamicRoutes = groupIds.map((id) => ({
    url: `${baseUrl}/group/invite/${id}`,
    lastModified: new Date().toISOString(),
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
