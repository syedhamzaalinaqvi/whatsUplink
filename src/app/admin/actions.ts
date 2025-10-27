
'use server';

import { revalidatePath } from 'next/cache';
import { doc, deleteDoc, updateDoc, getFirestore, serverTimestamp, writeBatch, collection, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { z } from 'zod';
import type { FormState } from '../actions';
import type { GroupLink, ModerationSettings } from '@/lib/data';
import { mapDocToGroupLink } from '@/lib/data';

function getFirestoreInstance() {
  if (!getApps().length) {
    initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return getFirestore();
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; message: string }> {
  if (!groupId) {
    return { success: false, message: 'Group ID is required.' };
  }

  try {
    const firestore = getFirestoreInstance();
    const groupDocRef = doc(firestore, 'groups', groupId);
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
    const firestore = getFirestoreInstance();
    const groupDocRef = doc(firestore, 'groups', id);

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
    const firestore = getFirestoreInstance();
    const groupDocRef = doc(firestore, 'groups', groupId);
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
        const firestore = getFirestoreInstance();
        const batch = writeBatch(firestore);

        groupIds.forEach(id => {
            const groupDocRef = doc(firestore, 'groups', id);
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
        const firestore = getFirestoreInstance();
        const batch = writeBatch(firestore);

        groupIds.forEach(id => {
            const groupDocRef = doc(firestore, 'groups', id);
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
    const firestore = getFirestoreInstance();
    const batch = writeBatch(firestore);
    const groupsRef = collection(firestore, 'groups');
    const querySnapshot = await getDocs(groupsRef);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { showClicks: show });
    });
    await batch.commit();
    
    // Also update the global setting
    const settingsDocRef = doc(firestore, 'settings', 'moderation');
    await updateDoc(settingsDocRef, { showClicks: show });


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
        const firestore = getFirestoreInstance();
        const settingsDocRef = doc(firestore, 'settings', 'moderation');
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
        const firestore = getFirestoreInstance();
        const settingsDocRef = doc(firestore, 'settings', 'moderation');
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
