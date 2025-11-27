
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
import type { BreadcrumbItem } from '@/components/layout/breadcrumbs';

type Props = {
  params: { country: string };
};

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const allCountries = await getCountries();
  const countryInfo = allCountries.find(c => c.value === params.country);
  const countryLabel = countryInfo ? countryInfo.label : params.country.toUpperCase();

  const title = `${countryLabel} WhatsApp Group Links | WhatsUpLink`;
  const description = `Find and join ${countryLabel} WhatsApp group links. The best directory for WhatsApp groups and channels from ${countryLabel}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function CountryPage({ params }: Props) {
  const { country } = params;
  if (!country) notFound();

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
    where('country', '==', country)
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

  const countryLabel = countries.find(c => c.value === country)?.label || country;
  const combinedSettings = { ...settings, layout: layoutSettings };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: countryLabel }
  ];

  // Dynamic SEO Content
  const seoTitle = `Top Active WhatsApp Group Links in ${countryLabel}`;
  const seoContent = `Looking for active WhatsApp group links from ${countryLabel}? You've found the ultimate resource. WhatsUpLink offers the largest, most up-to-date list of active group links for ${countryLabel}. Whether you're searching for local community groups, business networking, or entertainment, our active WhatsApp link directory is your best bet. All links are verified to ensure you're joining active and relevant groups from ${countryLabel}. Explore the best active WhatsApp group links today!`;

  return (
    <HomePage 
      initialSettings={combinedSettings}
      allGroups={allGroups}
      initialCategories={categories}
      initialCountries={countries}
      pageTitle={`Groups in '${countryLabel}'`}
      breadcrumbItems={breadcrumbItems}
      seoTitle={seoTitle}
      seoContent={seoContent}
    />
  );
}

// Generate static pages for all existing countries for better SEO
export async function generateStaticParams() {
    const countries = await getCountries();
    return countries.map((country) => ({
        country: country.value,
    }));
}
