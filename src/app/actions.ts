
'use server';

import { z } from 'zod';
import type { GroupLink } from '@/lib/data';
import { getLinkPreview } from 'link-preview-js';
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getFirestore();
}

const submitGroupSchema = z.object({
  link: z.string().url('Please enter a valid WhatsApp group link'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  country: z.string().min(1, 'Please select a country'),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type FormState = {
  message: string;
  group?: GroupLink;
  errors?: {
    link?: string[];
    title?: string[];
    description?: string[];
    category?: string[];
    country?: string[];
    tags?: string[];
    imageUrl?: string[];
  };
};

export async function getGroupPreview(link: string) {
  'use server';
  if (!link || !link.startsWith('https://chat.whatsapp.com')) {
    return { error: 'Invalid WhatsApp group link.' };
  }
  try {
    const preview = await getLinkPreview(link, {
      headers: {
        'X-Link-Preview-Api-Key': '883f322167cd5c53e0c616349ea3f5e9',
      },
    });

    if ('images' in preview && 'title' in preview && 'description' in preview) {
        return {
            title: preview.title,
            description: preview.description,
            image: preview.images[0],
        };
    }
    return { error: 'Could not fetch group preview.' };

  } catch (e: any) {
    console.error('Link preview error:', e);
    return { error: e.message || 'Failed to fetch link preview.' };
  }
}


export async function submitGroup(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = submitGroupSchema.safeParse({
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

  const { link, title, description, category, country, tags, imageUrl } = validatedFields.data;

  try {
    const firestore = getFirestoreInstance();
    const groupsCollection = collection(firestore, 'groups');

    const newGroupData = {
      title,
      description,
      link,
      imageUrl: imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
      imageHint: 'group preview',
      category,
      country,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(groupsCollection, newGroupData);

    const newGroup: GroupLink = {
      ...newGroupData,
      id: docRef.id,
      createdAt: new Date().toISOString(), // Use client-side date for immediate feedback
    };

    return {
      message: 'Group submitted successfully!',
      group: newGroup,
    };

  } catch (error) {
    console.error('Submission processing failed:', error);
    return { message: 'Failed to submit group. Please try again.' };
  }
}

const loginSchema = z.object({
    username: z.string().min(1, { message: "Username is required" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export async function login(formData: FormData) {
    const validatedFields = loginSchema.safeParse({
        username: formData.get('username'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }

    const { username, password } = validatedFields.data;

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (username === adminUsername && password === adminPassword) {
        return { success: true, message: 'Login successful!' };
    } else {
        return { success: false, message: 'Invalid username or password.' };
    }
}
