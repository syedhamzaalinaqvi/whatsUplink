import { initializeFirebase } from '@/firebase';
import { getDoc, doc, collection, getDocs, query, where, limit } from 'firebase/firestore';

export type GroupLink = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imageHint: string;
  category: string;
  country: string;
  tags: string[];
  createdAt: string;
};

export async function getGroupById(id: string | undefined): Promise<GroupLink | undefined> {
    if (!id) return undefined;
    
    try {
        const { firestore } = initializeFirebase();
        const groupDocRef = doc(firestore, 'groups', id);
        const docSnap = await getDoc(groupDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                title: data.title,
                description: data.description,
                link: data.link,
                imageUrl: data.imageUrl,
                imageHint: data.imageHint || '',
                category: data.category,
                country: data.country,
                tags: data.tags || [],
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            } as GroupLink;
        } else {
            console.log("No such document!");
            return undefined;
        }
    } catch (error) {
        console.error("Error getting group by ID:", error);
        return undefined;
    }
}

export async function getRelatedGroups(currentGroup: GroupLink | undefined) {
    if (!currentGroup) return [];

    try {
        const { firestore } = initializeFirebase();
        const groupsCollection = collection(firestore, 'groups');
        const q = query(
            groupsCollection,
            where('category', '==', currentGroup.category),
            where('__name__', '!=', currentGroup.id), // Exclude the current group using document ID
            limit(4)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
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
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            } as GroupLink;
        });
    } catch (error) {
        console.error("Error fetching related groups:", error);
        return [];
    }
}
