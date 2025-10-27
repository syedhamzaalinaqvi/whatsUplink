
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
  featured: boolean;
  createdAt: string | null; // Always a string or null
  type: 'group' | 'channel';
  clicks?: number;
  showClicks?: boolean;
  submissionCount?: number;
  lastSubmittedAt?: string | null;
};

export type ModerationSettings = {
    cooldownEnabled: boolean;
    cooldownValue: number;
    cooldownUnit: 'hours' | 'days' | 'months';
};

// This function now robustly handles Timestamps from the server
// and ensures a serializable string is always returned.
export function mapDocToGroupLink(doc: DocumentData): GroupLink {
    const data = doc.data();
    
    const formatTimestamp = (timestamp: any): string | null => {
        if (!timestamp) return null;
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate().toISOString();
        }
        // Handle cases where it might already be a string from a previous serialization
        if (typeof timestamp === 'string') {
            const date = new Date(timestamp);
            return !isNaN(date.getTime()) ? date.toISOString() : null;
        }
        // Handle Firestore server timestamp object before it's converted
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toISOString();
        }
        return null;
    }

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
        featured: data.featured || false,
        createdAt: formatTimestamp(data.createdAt),
        type: data.type || 'group',
        clicks: data.clicks || 0,
        showClicks: data.showClicks === undefined ? true : data.showClicks,
        submissionCount: data.submissionCount || 1,
        lastSubmittedAt: formatTimestamp(data.lastSubmittedAt),
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
