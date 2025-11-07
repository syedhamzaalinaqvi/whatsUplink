
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
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
