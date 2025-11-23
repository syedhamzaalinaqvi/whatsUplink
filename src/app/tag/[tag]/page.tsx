
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from '@/lib/admin-settings';
import { getCategories, getCountries, getLayoutSettings } from '@/app/admin/actions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { mapDocToGroupLink } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { tag: string };
};

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tags = params.tag.split('+').map(t => decodeURIComponent(t));
  const tagTitle = tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');

  const title = `Active ${tagTitle} WhatsApp Group Links | WhatsUpLink`;
  const description = `Find and join the best ${tagTitle} WhatsApp groups. The ultimate directory for active communities related to ${tagTitle}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}


export default async function TagPage({ params }: Props) {
  const { tag } = params;
  if (!tag) notFound();

  const tags = tag.split('+').map(t => decodeURIComponent(t).toLowerCase());

  // Fetch settings and taxonomies on the server.
  const [settings, categories, countries, layoutSettings] = await Promise.all([
    getModerationSettings(),
    getCategories(),
    getCountries(),
    getLayoutSettings()
  ]);

  const db = getFirestoreInstance();
  
  // Firestore's 'array-contains-all' is perfect for this.
  const groupsQuery = query(
    collection(db, 'groups'), 
    where('tags', 'array-contains-all', tags)
  );

  const groupSnapshot = await getDocs(groupsQuery);
  const allGroups = groupSnapshot.docs.map(g => {
    const group = mapDocToGroupLink(g);
    group.showClicks = settings.showClicks; // Ensure global setting is applied
    return group;
  }).sort((a, b) => {
    // Sort manually after fetching
    const dateA = a.lastSubmittedAt ? new Date(a.lastSubmittedAt).getTime() : 0;
    const dateB = b.lastSubmittedAt ? new Date(b.lastSubmittedAt).getTime() : 0;
    return dateB - dateA;
  });

  const tagTitle = tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
  const combinedSettings = { ...settings, layout: layoutSettings };

  // Dynamic SEO Content
  const seoTitle = `Best WhatsApp Group Links for ${tagTitle}`;
  const seoContent = `Explore our curated collection of active WhatsApp group links for interests in ${tagTitle}. WhatsUpLink is your top destination for discovering engaging communities. Whether you're searching for ${tagTitle} discussions, hobby groups, or more, find the most up-to-date and active links right here.`;


  return (
    <HomePage 
      initialSettings={combinedSettings}
      allGroups={allGroups}
      initialCategories={categories}
      initialCountries={countries}
      pageTitle={`Groups Tagged '${tagTitle}'`}
      seoTitle={seoTitle}
      seoContent={seoContent}
    />
  );
}
