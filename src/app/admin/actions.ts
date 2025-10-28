
'use server';

import { revalidatePath } from 'next/cache';
import { doc, deleteDoc, updateDoc, serverTimestamp, writeBatch, collection, getDocs, setDoc, getDoc, query, orderBy, limit, startAfter, endBefore, limitToLast, type DocumentSnapshot } from 'firebase/firestore';
import { z } from 'zod';
import type { FormState } from '../actions';
import type { GroupLink, ModerationSettings } from '@/lib/data';
import { mapDocToGroupLink } from '@/lib/data';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    // It's safe to import and use getFirestore here because this is a server action
    const { getFirestore } = require('firebase/firestore');
    return getFirestore();
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
    const batch = writeBatch(db);
    const groupsRef = collection(db, 'groups');
    const querySnapshot = await getDocs(groupsRef);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { showClicks: show });
    });
    
    // Also update the global setting
    const settingsDocRef = doc(db, 'settings', 'moderation');
    await setDoc(settingsDocRef, { showClicks: show }, { merge: true });

    await batch.commit();

    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true, message: `Click visibility ${show ? 'enabled' : 'disabled'} for all groups.` };
  } catch (error) {
    console.error('Error toggling click visibility:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update visibility: ${errorMessage}` };
  }
}

const moderationSettingsSchema = z.object({
    cooldownEnabled: z.enum(['on', 'off']).transform(val => val === 'on'),
    cooldownValue: z.coerce.number().min(1, 'Value must be at least 1'),
    cooldownUnit: z.enum(['hours', 'days', 'months']),
});

export async function saveModerationSettings(formData: FormData): Promise<{ success: boolean; message: string }> {
    const validatedFields = moderationSettingsSchema.safeParse({
        cooldownEnabled: formData.get('cooldownEnabled'),
        cooldownValue: formData.get('cooldownValue'),
        cooldownUnit: formData.get('cooldownUnit'),
    });
    
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid settings.' };
    }

    try {
        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'moderation');
        // We only save the cooldown settings here, showClicks is handled separately
        await updateDoc(settingsDocRef, {
            cooldownEnabled: validatedFields.data.cooldownEnabled,
            cooldownValue: validatedFields.data.cooldownValue,
            cooldownUnit: validatedFields.data.cooldownUnit,
        });
        revalidatePath('/admin');
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
            return docSnap.data() as ModerationSettings;
        } else {
            // If the document doesn't exist, create it with default values
            const defaultSettings: ModerationSettings = {
                cooldownEnabled: true,
                cooldownValue: 6,
                cooldownUnit: 'hours',
                showClicks: true,
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
    
    const hasPrevPage = pageDirection === 'prev' || (pageDirection === 'next' && !!cursorId);

    return { groups, hasNextPage, hasPrevPage };
}
