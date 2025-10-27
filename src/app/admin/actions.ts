
'use server';

import { revalidatePath } from 'next/cache';
import { doc, deleteDoc, updateDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { z } from 'zod';
import type { FormState } from '../actions';
import type { GroupLink } from '@/lib/data';

function getFirestoreInstance() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
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

    // This object is sent to Firestore and can contain the serverTimestamp
    const dataForDb = {
      ...dataToUpdate,
      tags: dataToUpdate.tags ? dataToUpdate.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      imageUrl: dataToUpdate.imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
      updatedAt: serverTimestamp(),
    };

    await updateDoc(groupDocRef, dataForDb);

    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/group/invite/${id}`);

    // This object is returned to the client and must be serializable
    const updatedGroup: GroupLink = {
        id,
        ...dataToUpdate,
        tags: dataToUpdate.tags ? dataToUpdate.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        imageUrl: dataToUpdate.imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
        createdAt: new Date().toISOString(), // This won't be perfect but avoids another db read
        imageHint: '',
    };

    return {
      message: 'Group updated successfully!',
      group: updatedGroup,
    };

  } catch (error) {
    console.error('Update processing failed:', error);
    return { message: 'Failed to update group. Please try again.' };
  }
}
