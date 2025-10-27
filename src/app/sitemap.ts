import { MetadataRoute } from 'next';
import { collection, getDocs } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { adminDb } from '@/lib/firebase-admin';


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
  
  const groupsCollection = collection(adminDb, 'groups');
  const querySnapshot = await getDocs(groupsCollection);
  const groups = querySnapshot.docs.map(mapDocToGroupLink);


  const dynamicRoutes = groups.map((group) => ({
    url: `${baseUrl}/group/invite/${group.id}`,
    lastModified: group.createdAt || new Date().toISOString(),
  }));

  return [...staticRoutes, ...dynamicRoutes];
}

    