
import { getDoc, doc, collection, getDocs, query, where, limit, Timestamp, Firestore, DocumentData } from 'firebase/firestore';

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
export function safeGetDate(createdAt: any): string {
    if (!createdAt) {
        return new Date(0).toISOString(); // Fallback for missing timestamps to sort them to the end
    }
    if (createdAt instanceof Timestamp) {
      return createdAt.toDate().toISOString();
    }
    // Handle cases where it might be a plain object from server-side rendering
    if (typeof createdAt === 'object' && createdAt.seconds !== undefined && createdAt.nanoseconds !== undefined) {
      return new Date(createdAt.seconds * 1000).toISOString();
    }
    // Fallback for string or number formats, which new submissions will have
    try {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    } catch (e) {
        // Ignore parsing errors and fall back
    }
    return new Date(0).toISOString();
}

export function mapDocToGroupLink(doc: DocumentData): GroupLink {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title || 'Untitled',
        description: data.description || 'No description',
        link: data.link || '',
        imageUrl: data.imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
        imageHint: data.imageHint || '',
        category: data.category || 'uncategorized',
        country: data.country || 'unknown',
        tags: data.tags || [],
        createdAt: safeGetDate(data.createdAt),
    };
}


export async function getGroupById(firestore: Firestore, id: string | undefined): Promise<GroupLink | undefined> {
    if (!id) return undefined;
    
    try {
        const groupDocRef = doc(firestore, 'groups', id);
        const docSnap = await getDoc(groupDocRef);

        if (docSnap.exists()) {
            return mapDocToGroupLink(docSnap);
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
        return querySnapshot.docs.map(mapDocToGroupLink);
    } catch (error) {
        console.error("Error fetching related groups:", error);
        return [];
    }
}
