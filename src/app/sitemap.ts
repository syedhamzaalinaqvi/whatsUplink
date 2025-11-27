
import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { getCategories, getCountries } from '@/app/admin/actions';

function getDb() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

function sanitizeTag(tag: string): string {
    if (!tag) return '';
    return tag
        .trim()
        // Remove any character that is not a letter, number, or space
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .slice(0, 30) // Truncate long tags
        .trim();
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
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));
  
  const db = getDb();
  
  // Fetch all dynamic routes in parallel
  const [
    groupsSnapshot,
    categories,
    countries
  ] = await Promise.all([
    getDocs(query(collection(db, 'groups'))),
    getCategories(),
    getCountries()
  ]);

  const groupRoutes = groupsSnapshot.docs.map(doc => ({
    url: `${baseUrl}/group/invite/${doc.id}`,
    lastModified: doc.data().lastSubmittedAt?.toDate().toISOString() || new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/category/${category.value}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const countryRoutes = countries.map((country) => ({
    url: `${baseUrl}/country/${country.value}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const allTags = new Set<string>();
  groupsSnapshot.docs.forEach(doc => {
      const tags = doc.data().tags;
      if (Array.isArray(tags)) {
          tags.forEach(tag => {
              const cleanTag = sanitizeTag(tag);
              if (cleanTag) {
                  allTags.add(cleanTag);
              }
          });
      }
  });

  const tagRoutes = Array.from(allTags).map(tag => ({
      url: `${baseUrl}/tag/${encodeURIComponent(tag)}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
  }));

  return [...staticRoutes, ...groupRoutes, ...categoryRoutes, ...countryRoutes, ...tagRoutes];
}
