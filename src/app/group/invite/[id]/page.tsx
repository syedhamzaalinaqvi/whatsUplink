
import { notFound } from 'next/navigation';
import { getGroupById, getRelatedGroups } from '@/lib/data';
import { GroupDetailView } from '@/components/groups/group-detail-view';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getFirestore } from 'firebase/firestore';
import { getCategories, getCountries } from '@/app/admin/actions';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

function getDb() {
    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return getFirestore(app);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const db = getDb();
  const group = await getGroupById(db, params.id);

  if (!group) {
    return {
      title: 'Group Link Not Found | WhatsUpLink',
      description: 'The WhatsApp group link you are looking for could not be found.',
    };
  }

  const title = `Join ${group.title} WhatsApp Group Link | WhatsUpLink`;
  const description = `Find and join the ${group.title} WhatsApp group link. ${group.description.substring(0, 120)}... Discover more groups for ${group.category} and from ${group.country}.`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: group.description,
      images: [
        {
          url: group.imageUrl,
          width: 512,
          height: 512,
          alt: `Logo for ${group.title} WhatsApp Group`,
        },
      ],
      type: 'website',
    },
  };
}


export default async function GroupDetailPage({ params }: Props) {
  const db = getDb();
  
  // Fetch all required data in parallel
  const [group, categories, countries] = await Promise.all([
    getGroupById(db, params.id),
    getCategories(),
    getCountries()
  ]);
  
  if (!group) {
    notFound();
  }

  // Refetch related groups now that we have the full group object.
  const relatedGroups = await getRelatedGroups(db, group);

  return (
    <GroupDetailView 
      group={group} 
      relatedGroups={relatedGroups} 
      categories={categories}
      countries={countries}
    />
  );
}
