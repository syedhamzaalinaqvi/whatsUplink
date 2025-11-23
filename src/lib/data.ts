
import { getDoc, doc, collection, getDocs, query, where, limit, Timestamp, Firestore, DocumentData } from 'firebase/firestore';
import { getModerationSettings as getGlobalModerationSettings } from '@/lib/admin-settings';
import { unstable_cache } from 'next/cache';

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
  totalRating?: number;
  ratingCount?: number;
};

export type Report = {
    id: string;
    groupId: string;
    groupTitle: string;
    reason: string;
    status: 'pending' | 'resolved';
    createdAt: string | null;
}

export type ModerationSettings = {
    cooldownEnabled: boolean;
    cooldownValue: number;
    cooldownUnit: 'hours' | 'days' | 'months';
    showClicks: boolean;
    groupsPerPage: number;
    featuredGroupsDisplay: 'slider' | 'grid' | 'list';
    showNewsletter: boolean;
    showDynamicSeoContent: boolean;
    showRatings: boolean;
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

export type BackgroundSettings = {
  bgImageEnabled: boolean;
  bgImageUrl: string;
};

export type SeoContentSettings = {
    enabled: boolean;
    heading: string;
    content: string;
};

export type LayoutSettings = {
  headerScripts: string;
  logoUrl?: string;
  navLinks: NavLink[];
  footerContent: FooterContent;
  backgroundSettings: BackgroundSettings;
  seoContent: SeoContentSettings;
};

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

// This function now robustly handles Timestamps from the server
// and ensures a serializable string is always returned.
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
        featured: data.featured || false,
        createdAt: formatTimestamp(data.createdAt),
        type: data.type || 'group',
        clicks: data.clicks || 0,
        // If showClicks is not defined on the doc, default to true for backward compatibility.
        // This ensures old and new documents behave consistently.
        showClicks: typeof data.showClicks === 'boolean' ? data.showClicks : true,
        submissionCount: data.submissionCount || 1,
        lastSubmittedAt: formatTimestamp(data.lastSubmittedAt),
        totalRating: data.totalRating || 0,
        ratingCount: data.ratingCount || 0,
    };
}

export function mapDocToReport(doc: DocumentData): Report {
    const data = doc.data();
    return {
        id: doc.id,
        groupId: data.groupId || '',
        groupTitle: data.groupTitle || 'Unknown Group',
        reason: data.reason || 'No reason given',
        status: data.status || 'pending',
        createdAt: formatTimestamp(data.createdAt),
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

// Caching `getGroupById` to improve performance on repeated visits.
export const getGroupById = unstable_cache(
    async (firestore: Firestore, id: string | undefined): Promise<GroupLink | undefined> => {
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
    },
    ['group-by-id'], // Cache key prefix
    { revalidate: 600 } // Revalidate cache every 10 minutes
);


// Caching `getRelatedGroups` to improve performance.
export const getRelatedGroups = unstable_cache(
    async (firestore: Firestore, currentGroup: GroupLink): Promise<GroupLink[]> => {
        if (!currentGroup) return [];

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
    },
    ['related-groups'], // Cache key prefix
    { revalidate: 600 } // Revalidate cache every 10 minutes
);
