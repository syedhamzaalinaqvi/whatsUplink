
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from '@/lib/admin-settings';
import { getCategories, getCountries } from '@/app/admin/actions';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { mapDocToGroupLink } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { category: string };
};

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const allCategories = await getCategories();
  const categoryInfo = allCategories.find(c => c.value === params.category);
  const categoryLabel = categoryInfo ? categoryInfo.label : params.category.replace(/-/g, ' ');

  const title = `Best ${categoryLabel} WhatsApp Group Links | WhatsUpLink`;
  const description = `Discover and join the best ${categoryLabel} WhatsApp groups and channels. The ultimate directory for finding communities about ${categoryLabel}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}


export default async function CategoryPage({ params }: Props) {
  const { category } = params;
  if (!category) notFound();

  // Fetch settings and taxonomies on the server.
  const [settings, categories, countries] = await Promise.all([
    getModerationSettings(),
    getCategories(),
    getCountries()
  ]);

  const db = getFirestoreInstance();
  const groupsQuery = query(
    collection(db, 'groups'), 
    where('category', '==', category),
    orderBy('lastSubmittedAt', 'desc')
  );
  const groupSnapshot = await getDocs(groupsQuery);
  const allGroups = groupSnapshot.docs.map(g => {
    const group = mapDocToGroupLink(g);
    group.showClicks = settings.showClicks; // Ensure global setting is applied
    return group;
  });

  return (
    <HomePage 
      initialSettings={settings}
      allGroups={allGroups}
      initialCategories={categories}
      initialCountries={countries}
      pageTitle={`Groups in '${categories.find(c => c.value === category)?.label || category}'`}
    />
  );
}

// Generate static pages for all existing categories for better SEO
export async function generateStaticParams() {
    const categories = await getCategories();
    return categories.map((category) => ({
        category: category.value,
    }));
}
