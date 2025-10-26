
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
  createdAt: any; // Pass the raw value to the client
};

// This function is no longer needed here, parsing will be done on the client.
export function safeGetDate(createdAt: any): any {
    return createdAt || null;
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
        createdAt: data.createdAt || null, // Pass raw timestamp object or null
    };
}


export async function getGroupById(firestore: Firestore, id: string | undefined): Promise<GroupLink | undefined> {
    if (!id) return undefined;
    
    try {
        const groupDocRef = doc(firestore, 'groups', id);
        const docSnap = await getDoc(groupDocRef);

        if (docSnap.exists()) {
            // Use a temporary mapping to convert for the detail page
            const data = docSnap.data();
            return {
                id: docSnap.id,
                title: data.title || 'Untitled',
                description: data.description || 'No description',
                link: data.link || '',
                imageUrl: data.imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
                imageHint: data.imageHint || '',
                category: data.category || 'uncategorized',
                country: data.country || 'unknown',
                tags: data.tags || [],
                createdAt: data.createdAt ? new Timestamp(data.createdAt._seconds, data.createdAt._nanoseconds).toDate().toISOString() : new Date(0).toISOString(),
            };
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
        // Map related groups, ensuring createdAt is a string
        return querySnapshot.docs.map(doc => {
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
                createdAt: data.createdAt ? new Timestamp(data.createdAt._seconds, data.createdAt._nanoseconds).toDate().toISOString() : new Date(0).toISOString(),
            }
        });
    } catch (error) {
        console.error("Error fetching related groups:", error);
        return [];
    }
}
