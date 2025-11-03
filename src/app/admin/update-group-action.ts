
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { submitGroupSchema } from '@/lib/zod-schemas';
import type { FormState } from '@/lib/types';
import { mapDocToGroupLink } from '@/lib/data';

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

const updateGroupSchema = submitGroupSchema.extend({
  id: z.string(),
});

type UpdateGroupPayload = z.infer<typeof updateGroupSchema>;

export async function updateGroup(
  payload: UpdateGroupPayload
): Promise<FormState> {
  const validatedFields = updateGroupSchema.safeParse(payload);

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
      tags: dataToUpdate.tags ? dataToUpdate.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [],
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

    