
import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

function getDb() {
    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return getFirestore(app);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://whatsuplink.com';

  const staticRoutes = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));
  
  const db = getDb();
  const groupsCollection = collection(db, 'groups');
  const querySnapshot = await getDocs(groupsCollection);
  const groups = querySnapshot.docs.map(mapDocToGroupLink);


  const dynamicRoutes = groups.map((group) => ({
    url: `${baseUrl}/group/invite/${group.id}`,
    lastModified: group.createdAt || new Date().toISOString(),
  }));

  return [...staticRoutes, ...dynamicRoutes];
}

    