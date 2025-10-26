
import { collection, getDocs, QuerySnapshot, DocumentData, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { GroupLink } from '@/lib/data';
import { mapDocToGroupLink } from '@/lib/data';
import { HomePage } from '@/components/groups/home-page';

async function getGroups(): Promise<GroupLink[]> {
  try {
    const { firestore } = initializeFirebase();
    const groupsCollection = collection(firestore, 'groups');
    const q = query(groupsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("No documents found in 'groups' collection.");
      return [];
    }

    const groupsData = querySnapshot.docs.map(mapDocToGroupLink);
    return groupsData;
  } catch (error) {
    console.error("Error fetching groups from Firestore:", error);
    // In case of a server-side error, return an empty array
    // The client page will show the "no groups found" message.
    return [];
  }
}

export default async function Home() {
  const initialGroups = await getGroups();

  return <HomePage initialGroups={initialGroups} />;
}
