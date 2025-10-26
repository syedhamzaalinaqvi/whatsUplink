
import { getDoc, doc, collection, getDocs, query, where, limit, Timestamp, Firestore } from 'firebase/firestore';

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


export async function getGroupById(firestore: Firestore, id: string | undefined): Promise<GroupLink | undefined> {
    if (!id) return undefined;
    
    try {
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
                createdAt: safeGetDate(data.createdAt),
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

export async function getRelatedGroups(firestore: Firestore, currentGroup: GroupLink | undefined) {
    if (!currentGroup) return [];

    try {
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
                createdAt: safeGetDate(data.createdAt),
            } as GroupLink;
        });
    } catch (error) {
        console.error("Error fetching related groups:", error);
        return [];
    }
}
