
import { collection, getDocs, orderBy, query as firestoreQuery, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { Dialog } from '@/components/ui/dialog';

// Helper function to safely convert Firestore Timestamps or other date formats to ISO strings
function safeGetDate(createdAt: any): string {
    if (!createdAt) {
        return new Date().toISOString(); // Fallback for missing timestamps
    }
    if (createdAt instanceof Timestamp) {
      return createdAt.toDate().toISOString();
    }
    // Handle cases where it might be a plain object from server-side rendering
    if (typeof createdAt === 'object' && createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toISOString();
    }
    // Fallback for string or number formats
    try {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    } catch (e) {
        // Ignore parsing errors and fall back
    }
    return new Date().toISOString();
}


async function getGroups(): Promise<GroupLink[]> {
  try {
    const { firestore } = initializeFirebase();
    const groupsCollection = collection(firestore, 'groups');
    const q = firestoreQuery(groupsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("No documents found in 'groups' collection.");
        return [];
    }

    const groupsData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        link: data.link,
        imageUrl: data.imageUrl,
        imageHint: data.imageHint || '',
        category: data.category,
        country: data.country,
        tags: data.tags || [],
        createdAt: safeGetDate(data.createdAt),
      } as GroupLink;
    });
    return groupsData;
  } catch (error) {
    console.error("Error fetching groups from Firestore:", error);
    // In case of an error, return an empty array to prevent the page from crashing.
    return [];
  }
}

export default async function Home() {
  const initialGroups = await getGroups();

  return (
    <GroupClientPage initialGroups={initialGroups} />
  );
}
