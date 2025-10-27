import { MetadataRoute } from 'next';
import { getFirestore, collection, getDocs, initializeApp, getApps } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';

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
  
  const firestore = getFirestoreInstance();
  const groupsCollection = collection(firestore, 'groups');
  const querySnapshot = await getDocs(groupsCollection);
  const groups = querySnapshot.docs.map(mapDocToGroupLink);


  const dynamicRoutes = groups.map((group) => ({
    url: `${baseUrl}/group/invite/${group.id}`,
    lastModified: group.createdAt || new Date().toISOString(),
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
