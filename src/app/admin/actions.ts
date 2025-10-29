
'use server';

import { revalidatePath } from 'next/cache';
import { doc, deleteDoc, updateDoc, serverTimestamp, writeBatch, collection, getDocs, setDoc, getDoc, query, orderBy, limit, startAfter, endBefore, limitToLast, type DocumentSnapshot } from 'firebase/firestore';
import { z } from 'zod';
import type { FormState } from '../actions';
import type { GroupLink, ModerationSettings, Category, Country, LayoutSettings, NavLink } from '@/lib/data';
import { mapDocToGroupLink, mapDocToCategory, mapDocToCountry } from '@/lib/data';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { DEFAULT_CATEGORIES, DEFAULT_COUNTRIES } from '@/lib/constants';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    const { getFirestore } = require('firebase/firestore');
    return getFirestore(app);
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; message: string }> {
  if (!groupId) {
    return { success: false, message: 'Group ID is required.' };
  }

  try {
    const db = getFirestoreInstance();
    const groupDocRef = doc(db, 'groups', groupId);
    await deleteDoc(groupDocRef);
    
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, message: 'Group deleted successfully.' };
  } catch (error) {
    console.error('Error deleting group:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete group: ${errorMessage}` };
  }
}

const updateGroupSchema = z.object({
  id: z.string(),
  link: z.string().url('Please enter a valid WhatsApp group link'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  country: z.string().min(1, 'Please select a country'),
  type: z.enum(['group', 'channel']),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
});


export async function updateGroup(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = updateGroupSchema.safeParse({
    id: formData.get('id'),
    link: formData.get('link'),
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    country: formData.get('country'),
    type: formData.get('type'),
    tags: formData.get('tags'),
    imageUrl: formData.get('imageUrl'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check your input.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { id, ...dataToUpdate } = validatedFields.data;

  try {
    const db = getFirestoreInstance();
    const groupDocRef = doc(db, 'groups', id);

    const dataForDb: { [key: string]: any } = {
      ...dataToUpdate,
      tags: dataToUpdate.tags ? dataToUpdate.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrl: dataToUpdate.imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
      updatedAt: serverTimestamp(),
    };

    await updateDoc(groupDocRef, dataForDb);

    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/group/invite/${id}`);

    const updatedDoc = await getDoc(groupDocRef);
    const updatedGroup = mapDocToGroupLink(updatedDoc);

    return {
      message: 'Group updated successfully!',
      group: updatedGroup,
    };

  } catch (error) {
    console.error('Update processing failed:', error);
    return { message: 'Failed to update group. Please try again.' };
  }
}

export async function toggleFeaturedStatus(groupId: string, currentStatus: boolean): Promise<{ success: boolean; message: string }> {
  if (!groupId) {
    return { success: false, message: 'Group ID is required.' };
  }

  try {
    const db = getFirestoreInstance();
    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, { featured: !currentStatus });
    
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, message: `Group marked as ${!currentStatus ? 'featured' : 'not featured'}.` };
  } catch (error) {
    console.error('Error toggling featured status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update group: ${errorMessage}` };
  }
}

export async function deleteMultipleGroups(groupIds: string[]): Promise<{ success: boolean, message: string }> {
    if (!groupIds || groupIds.length === 0) {
        return { success: false, message: 'No group IDs provided.' };
    }

    try {
        const db = getFirestoreInstance();
        const batch = writeBatch(db);

        groupIds.forEach(id => {
            const groupDocRef = doc(db, 'groups', id);
            batch.delete(groupDocRef);
        });

        await batch.commit();

        revalidatePath('/admin');
        revalidatePath('/');

        return { success: true, message: `${groupIds.length} groups deleted successfully.` };
    } catch (error) {
        console.error('Error deleting multiple groups:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete groups: ${errorMessage}` };
    }
}

export async function bulkSetFeaturedStatus(groupIds: string[], featured: boolean): Promise<{ success: boolean, message: string }> {
    if (!groupIds || groupIds.length === 0) {
        return { success: false, message: 'No group IDs provided.' };
    }

    try {
        const db = getFirestoreInstance();
        const batch = writeBatch(db);

        groupIds.forEach(id => {
            const groupDocRef = doc(db, 'groups', id);
            batch.update(groupDocRef, { featured });
        });

        await batch.commit();

        revalidatePath('/admin');
        revalidatePath('/');

        const actionText = featured ? 'marked as featured' : 'removed from featured';
        return { success: true, message: `${groupIds.length} group(s) ${actionText}.` };
    } catch (error) {
        console.error('Error bulk setting featured status:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to update groups: ${errorMessage}` };
    }
}

export async function toggleShowClicks(show: boolean): Promise<{ success: boolean; message: string }> {
  try {
    const db = getFirestoreInstance();
    
    // Update the global setting ONLY. This is much more efficient.
    const settingsDocRef = doc(db, 'settings', 'moderation');
    await setDoc(settingsDocRef, { showClicks: show }, { merge: true });

    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, message: `Click visibility set to ${show ? 'ON' : 'OFF'} globally.` };
  } catch (error) {
    console.error('Error toggling click visibility:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // The error message from Firestore now gets propagated to the UI.
    return { success: false, message: `Failed to update visibility: ${errorMessage}` };
  }
}

const moderationSettingsSchema = z.object({
    cooldownEnabled: z.enum(['on', 'off']).transform(val => val === 'on'),
    cooldownValue: z.coerce.number().min(1, 'Value must be at least 1'),
    cooldownUnit: z.enum(['hours', 'days', 'months']),
    groupsPerPage: z.coerce.number().min(1, 'Must be at least 1').max(100, 'Cannot exceed 100'),
    featuredGroupsDisplay: z.enum(['slider', 'grid', 'list']),
    showNewsletter: z.enum(['on', 'off']).transform(val => val === 'on'),
});

export async function saveModerationSettings(formData: FormData): Promise<{ success: boolean; message: string }> {
    const validatedFields = moderationSettingsSchema.safeParse({
        cooldownEnabled: formData.get('cooldownEnabled'),
        cooldownValue: formData.get('cooldownValue'),
        cooldownUnit: formData.get('cooldownUnit'),
        groupsPerPage: formData.get('groupsPerPage'),
        featuredGroupsDisplay: formData.get('featuredGroupsDisplay'),
        showNewsletter: formData.get('showNewsletter'),
    });
    
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid settings.' };
    }

    try {
        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'moderation');
        await updateDoc(settingsDocRef, {
            ...validatedFields.data,
        });
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Moderation settings saved successfully.' };
    } catch (error) {
        console.error('Error saving moderation settings:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to save settings: ${errorMessage}` };
    }
}

export async function getModerationSettings(): Promise<ModerationSettings> {
    try {
        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'moderation');
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Return existing data with defaults for any missing fields
            return {
                cooldownEnabled: data.cooldownEnabled ?? true,
                cooldownValue: data.cooldownValue ?? 6,
                cooldownUnit: data.cooldownUnit ?? 'hours',
                showClicks: data.showClicks ?? true,
                groupsPerPage: data.groupsPerPage ?? 20,
                featuredGroupsDisplay: data.featuredGroupsDisplay ?? 'slider',
                showNewsletter: data.showNewsletter ?? false,
            };
        } else {
            // If the document doesn't exist, create it with default values
            const defaultSettings: ModerationSettings = {
                cooldownEnabled: true,
                cooldownValue: 6,
                cooldownUnit: 'hours',
                showClicks: true,
                groupsPerPage: 20,
                featuredGroupsDisplay: 'slider',
                showNewsletter: false,
            };
            await setDoc(settingsDocRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error fetching moderation settings:', error);
    }
    // Return default settings if not found or on error
    return {
        cooldownEnabled: true,
        cooldownValue: 6,
        cooldownUnit: 'hours',
        showClicks: true,
        groupsPerPage: 20,
        featuredGroupsDisplay: 'slider',
        showNewsletter: false,
    };
}


export async function getPaginatedGroups(
    rowsPerPage: number,
    pageDirection: 'next' | 'prev' | 'first',
    cursorId?: string
): Promise<{ groups: GroupLink[], hasNextPage: boolean, hasPrevPage: boolean }> {
    const db = getFirestoreInstance();
    const groupsCollection = collection(db, 'groups');
    
    let q;
    let cursorDoc: DocumentSnapshot | undefined = undefined;

    if (pageDirection !== 'first' && cursorId) {
        const cursorDocSnap = await getDoc(doc(db, 'groups', cursorId));
        if (cursorDocSnap.exists()) {
            cursorDoc = cursorDocSnap;
        } else {
             // Invalid cursor, default to first page
             pageDirection = 'first';
        }
    }

    if (pageDirection === 'first') {
        q = query(groupsCollection, orderBy('createdAt', 'desc'), limit(rowsPerPage + 1));
    } else if (pageDirection === 'next' && cursorDoc) {
        q = query(groupsCollection, orderBy('createdAt', 'desc'), startAfter(cursorDoc), limit(rowsPerPage + 1));
    } else if (pageDirection === 'prev' && cursorDoc) {
        q = query(groupsCollection, orderBy('createdAt', 'desc'), endBefore(cursorDoc), limitToLast(rowsPerPage));
    } else {
        // Fallback to first page if logic is inconsistent
        q = query(groupsCollection, orderBy('createdAt', 'desc'), limit(rowsPerPage + 1));
    }
    
    const querySnapshot = await getDocs(q);
    
    let groups = querySnapshot.docs.map(mapDocToGroupLink);
    
    const hasNextPage = groups.length > rowsPerPage;
    if (hasNextPage) {
        groups.pop(); // Remove the extra item used for checking
    }
    
    if (pageDirection === 'prev') {
        // When going back, Firestore returns the last N items in ascending order of the orderBy field.
        // Since we orderBy 'createdAt' 'desc', we get them in reverse chronological order (oldest first).
        // We need to reverse them to show the newest of that page first.
        groups.reverse();
    }
    
    const hasPrevPage = pageDirection !== 'first' && !!cursorId;

    return { groups, hasNextPage, hasPrevPage };
}

// ----- Categories & Countries Management Actions -----

export async function getCategories(): Promise<Category[]> {
    const db = getFirestoreInstance();
    const catCollection = collection(db, 'categories');
    const q = query(catCollection, orderBy('label'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(mapDocToCategory);
}

export async function getCountries(): Promise<Country[]> {
    const db = getFirestoreInstance();
    const countryCollection = collection(db, 'countries');
    const q = query(countryCollection, orderBy('label'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(mapDocToCountry);
}

const taxonomySchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters.'),
  value: z.string().min(2, 'Value must be at least 2 characters. Use lowercase and hyphens (e.g., "my-value").').regex(/^[a-z0-9-]+$/, 'Value can only contain lowercase letters, numbers, and hyphens.'),
});

export async function saveTaxonomyItem(
    type: 'category' | 'country',
    isEditing: boolean,
    formData: FormData
): Promise<{ success: boolean; message: string }> {
    const validatedFields = taxonomySchema.safeParse({
        label: formData.get('label'),
        value: formData.get('value'),
    });

    if (!validatedFields.success) {
        const errorMsg = validatedFields.error.flatten().fieldErrors;
        return { success: false, message: errorMsg.label?.[0] || errorMsg.value?.[0] || 'Invalid data.' };
    }

    const { label, value } = validatedFields.data;
    const collectionName = type === 'category' ? 'categories' : 'countries';

    try {
        const db = getFirestoreInstance();
        const docRef = doc(db, collectionName, value);

        if (!isEditing) {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { success: false, message: `A ${type} with the value "${value}" already exists.` };
            }
        }

        await setDoc(docRef, { label, value }, { merge: isEditing });
        
        revalidatePath('/admin');
        revalidatePath('/'); // Revalidate homepage for filters

        return { success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully!` };
    } catch (error) {
        console.error(`Error saving ${type}:`, error);
        return { success: false, message: `Failed to save ${type}.` };
    }
}


export async function deleteTaxonomyItem(type: 'category' | 'country', value: string): Promise<{ success: boolean; message: string }> {
    if (!value) {
        return { success: false, message: 'Value is required.' };
    }
    
    // Prevent deletion of 'all'
    if (value === 'all') {
        return { success: false, message: 'Cannot delete the "all" value.' };
    }

    const collectionName = type === 'category' ? 'categories' : 'countries';

    try {
        const db = getFirestoreInstance();
        await deleteDoc(doc(db, collectionName, value));
        
        revalidatePath('/admin');
        revalidatePath('/');

        return { success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.` };
    } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        return { success: false, message: `Failed to delete ${type}.` };
    }
}

// One-time seeding function
export async function seedInitialData() {
    const db = getFirestoreInstance();
    const categoriesRef = collection(db, 'categories');
    const countriesRef = collection(db, 'countries');

    const catSnapshot = await getDocs(query(categoriesRef, limit(1)));
    const countrySnapshot = await getDocs(query(countriesRef, limit(1)));

    const batch = writeBatch(db);
    let writes = 0;

    if (catSnapshot.empty) {
        console.log('Seeding initial categories...');
        DEFAULT_CATEGORIES.forEach(cat => {
            if (cat.value !== 'all') { // Do not write 'all' to db
                const docRef = doc(db, 'categories', cat.value);
                batch.set(docRef, { label: cat.label, value: cat.value });
                writes++;
            }
        });
    }

    if (countrySnapshot.empty) {
        console.log('Seeding initial countries...');
        DEFAULT_COUNTRIES.forEach(country => {
             if (country.value !== 'all') { // Do not write 'all' to db
                const docRef = doc(db, 'countries', country.value);
                batch.set(docRef, { label: country.label, value: country.value });
                writes++;
             }
        });
    }

    if (writes > 0) {
        await batch.commit();
        console.log('Initial data seeding complete.');
    }
}

// ------ Layout Settings Actions ------

const defaultLayoutSettings: LayoutSettings = {
    headerScripts: '<!-- Add analytics or other scripts here -->',
    logoUrl: '/whatsuplink_logo_and_favicon_without_background.png',
    navLinks: [
        { id: '1', label: 'Home', href: '/' },
        { id: '2', label: 'About', href: '/about' },
        { id: '3', label: 'Contact', href: '/contact' },
        { id: '4', label: 'Privacy', href: '/privacy' },
        { id: '5', label: 'Terms', href: '/terms' },
    ],
    footerContent: {
        heading: 'WhatsUpLink',
        paragraph: 'Your number one directory for discovering and sharing WhatsApp group links.',
        copyrightText: `Built for WhatsUpLink. © ${new Date().getFullYear()}`,
    },
};

export async function getLayoutSettings(): Promise<LayoutSettings> {
    try {
        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'layout');
        const docSnap = await getDoc(settingsDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Merge with defaults to ensure all fields are present
            return {
                headerScripts: data.headerScripts ?? defaultLayoutSettings.headerScripts,
                logoUrl: data.logoUrl ?? defaultLayoutSettings.logoUrl,
                navLinks: data.navLinks && data.navLinks.length > 0 ? data.navLinks : defaultLayoutSettings.navLinks,
                footerContent: {
                    ...defaultLayoutSettings.footerContent,
                    ...data.footerContent,
                },
            };
        } else {
            // Document doesn't exist, create it with defaults
            await setDoc(settingsDocRef, defaultLayoutSettings);
            return defaultLayoutSettings;
        }
    } catch (error) {
        console.error('Error fetching layout settings:', error);
        // On error, return defaults to prevent site crash
        return defaultLayoutSettings;
    }
}

const layoutSettingsSchema = z.object({
  headerScripts: z.string().optional(),
  logoUrl: z.string().url().optional(),
  navLinks: z.string().transform(val => JSON.parse(val) as NavLink[]),
  footerHeading: z.string(),
  footerParagraph: z.string(),
  footerCopyright: z.string(),
});

export async function saveLayoutSettings(formData: FormData): Promise<{ success: boolean; message: string }> {
    const validatedFields = layoutSettingsSchema.safeParse({
        headerScripts: formData.get('headerScripts'),
        logoUrl: formData.get('logoUrl'),
        navLinks: formData.get('navLinks'),
        footerHeading: formData.get('footerHeading'),
        footerParagraph: formData.get('footerParagraph'),
        footerCopyright: formData.get('footerCopyright'),
    });

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten());
        return { success: false, message: 'Invalid data format.' };
    }

    try {
        const { headerScripts, navLinks, footerHeading, footerParagraph, footerCopyright, logoUrl } = validatedFields.data;
        
        const settingsToSave: Partial<LayoutSettings> = {
            headerScripts: headerScripts || '',
            logoUrl: logoUrl || '',
            navLinks: navLinks,
            footerContent: {
                heading: footerHeading,
                paragraph: footerParagraph,
                copyrightText: footerCopyright,
            },
        };

        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'layout');
        await setDoc(settingsDocRef, settingsToSave, { merge: true });

        // Revalidate all paths since header and footer are on every page
        revalidatePath('/', 'layout');

        return { success: true, message: 'Layout settings saved successfully.' };
    } catch (error) {
        console.error('Error saving layout settings:', error);
        return { success: false, message: 'Failed to save layout settings.' };
    }
}

    
