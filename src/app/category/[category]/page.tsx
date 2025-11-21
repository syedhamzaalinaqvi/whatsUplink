
import { HomePage } from '@/components/groups/home-page';
import { getModerationSettings } from '@/lib/admin-settings';
import { getCategories, getCountries, getLayoutSettings } from '@/app/admin/actions';
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
  const [settings, categories, countries, layoutSettings] = await Promise.all([
    getModerationSettings(),
    getCategories(),
    getCountries(),
    getLayoutSettings()
  ]);

  const db = getFirestoreInstance();
  // Remove orderby from query to avoid needing a composite index
  const groupsQuery = query(
    collection(db, 'groups'), 
    where('category', '==', category)
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

  const categoryLabel = categories.find(c => c.value === category)?.label || category;
  const combinedSettings = { ...settings, layout: layoutSettings };

  // Dynamic SEO Content
  const seoTitle = `Explore the Best ${categoryLabel} WhatsApp Group Links`;
  const seoContent = `Dive into our extensive collection of active WhatsApp group links dedicated to ${categoryLabel}. WhatsUpLink is your number one source for discovering and joining the most engaging and active communities. Whether you're looking for ${categoryLabel} groups for discussion, sharing content, or connecting with like-minded people, you'll find the best active links right here. Our directory is constantly updated to ensure you get access to fresh and active WhatsApp groups in the ${categoryLabel} category.`;


  return (
    <HomePage 
      initialSettings={combinedSettings}
      allGroups={allGroups}
      initialCategories={categories}
      initialCountries={countries}
      pageTitle={`Groups in '${categoryLabel}'`}
      seoTitle={seoTitle}
      seoContent={seoContent}
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
