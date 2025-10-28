
import { getDoc, doc, collection, getDocs, query, where, limit, Timestamp, Firestore, DocumentData } from 'firebase/firestore';
import { getModerationSettings as getGlobalModerationSettings } from '@/app/admin/actions';

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
    showClicks: boolean;
    groupsPerPage: number;
    featuredGroupsDisplay: 'slider' | 'grid' | 'list';
    showNewsletter: boolean;
};

export type Category = {
    id: string;
    label: string;
    value: string;
};

export type Country = {
    id: string;
    label: string;
    value: string;
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export type FooterContent = {
  heading: string;
  paragraph: string;
  copyrightText: string;
};

export type LayoutSettings = {
  headerScripts: string;
  navLinks: NavLink[];
  footerContent: FooterContent;
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
        if (typeof timestamp === 'object' && timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
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
        // If showClicks is not defined on the doc, default to true for backward compatibility.
        // This ensures old and new documents behave consistently.
        showClicks: typeof data.showClicks === 'boolean' ? data.showClicks : true,
        submissionCount: data.submissionCount || 1,
        lastSubmittedAt: formatTimestamp(data.lastSubmittedAt),
    };
}

export function mapDocToCategory(doc: DocumentData): Category {
    const data = doc.data();
    return {
        id: doc.id,
        label: data.label || 'No Label',
        value: data.value || doc.id,
    };
}

export function mapDocToCountry(doc: DocumentData): Country {
    const data = doc.data();
    return {
        id: doc.id,
        label: data.label || 'No Label',
        value: data.value || doc.id,
    };
}

export async function getGroupById(firestore: Firestore, id: string | undefined): Promise<GroupLink | undefined> {
    if (!id) return undefined;
    
    try {
        const [groupDocSnap, settings] = await Promise.all([
            getDoc(doc(firestore, 'groups', id)),
            getGlobalModerationSettings() // Fetch global settings
        ]);

        if (groupDocSnap.exists()) {
            const group = mapDocToGroupLink(groupDocSnap);
            // Override with the global setting
            group.showClicks = settings.showClicks;
            return group;
        } else {
            console.log("No such document!");
            return undefined;
        }
    } catch (error) {
        console.error("Error getting group by ID:", error);
        return undefined;
    }
}

export async function getRelatedGroups(firestore: Firestore, currentGroupOrId: GroupLink | string | undefined) {
    if (!currentGroupOrId) return [];

    let currentGroup: GroupLink | undefined;

    if (typeof currentGroupOrId === 'string') {
        currentGroup = await getGroupById(firestore, currentGroupOrId);
        if (!currentGroup) return [];
    } else {
        currentGroup = currentGroupOrId;
    }


    try {
        const [querySnapshot, settings] = await Promise.all([
            getDocs(query(
                collection(firestore, 'groups'),
                where('category', '==', currentGroup.category),
                where('__name__', '!=', currentGroup.id),
                limit(4)
            )),
            getGlobalModerationSettings() // Fetch global settings
        ]);

        return querySnapshot.docs.map(doc => {
            const group = mapDocToGroupLink(doc);
            // Override with the global setting
            group.showClicks = settings.showClicks;
            return group;
        });

    } catch (error) {
        console.error("Error fetching related groups:", error);
        return [];
    }
}

    
