
'use server';

import { z } from 'zod';
import type { GroupLink, ModerationSettings } from '@/lib/data';
import { getLinkPreview } from 'link-preview-js';
import { collection, addDoc, serverTimestamp, getFirestore, query, where, getDocs, updateDoc, increment, getDoc, doc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getModerationSettings } from './admin/actions';
import { mapDocToGroupLink } from '@/lib/data';

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
  type: z.enum(['group', 'channel'], { required_error: 'Please select a type' }),
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
    type?: string[];
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

function calculateCooldown(settings: ModerationSettings): number {
    const { cooldownValue, cooldownUnit } = settings;
    let cooldownMs = 0;
    if (cooldownUnit === 'hours') {
        cooldownMs = cooldownValue * 60 * 60 * 1000;
    } else if (cooldownUnit === 'days') {
        cooldownMs = cooldownValue * 24 * 60 * 60 * 1000;
    } else if (cooldownUnit === 'months') {
        cooldownMs = cooldownValue * 30 * 24 * 60 * 60 * 1000; // Approximation
    }
    return cooldownMs;
}

// Function to add a new group document
async function addNewGroup(firestore: any, groupData: Omit<GroupLink, 'id' | 'createdAt' | 'lastSubmittedAt'>) {
    const groupsCollection = collection(firestore, 'groups');
    const newGroupData = {
        ...groupData,
        createdAt: serverTimestamp(),
        lastSubmittedAt: serverTimestamp(),
        submissionCount: 1,
        clicks: 0,
        featured: false,
        showClicks: true,
    };
    const docRef = await addDoc(groupsCollection, newGroupData);
    const newDoc = await getDoc(docRef);
    return mapDocToGroupLink(newDoc);
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

  const { link, title, description, category, country, tags, imageUrl, type } = validatedFields.data;
  const firestore = getFirestoreInstance();
  
  try {
    const moderationSettings = await getModerationSettings();
    const groupsCollection = collection(firestore, 'groups');
    
    // The data for a new group
    const newGroupPayload = {
      title,
      description,
      link,
      imageUrl: imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
      imageHint: 'group preview',
      category,
      country,
      type,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    };

    // If cooldown is disabled, just add the new group without any checks.
    if (!moderationSettings.cooldownEnabled) {
        const newGroup = await addNewGroup(firestore, newGroupPayload);
        return { message: 'Group submitted successfully!', group: newGroup };
    }

    // Cooldown is ENABLED, so we perform checks.
    const q = query(groupsCollection, where('link', '==', link));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Link is new, so add it.
      const newGroup = await addNewGroup(firestore, newGroupPayload);
      return { message: 'Group submitted successfully!', group: newGroup };
    } else {
      // Link exists, so check the cooldown.
      const existingDoc = querySnapshot.docs[0];
      const existingGroupData = mapDocToGroupLink(existingDoc);
      const lastSubmitted = existingGroupData.lastSubmittedAt ? new Date(existingGroupData.lastSubmittedAt).getTime() : 0;
      const cooldownMs = calculateCooldown(moderationSettings);

      if (Date.now() - lastSubmitted < cooldownMs) {
          const timeLeft = cooldownMs - (Date.now() - lastSubmitted);
          const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
          return { message: `You have already submitted this link recently. Please try again in about ${hoursLeft} hour(s).` };
      } else {
          // Cooldown has passed, update the existing document.
          await updateDoc(existingDoc.ref, {
              submissionCount: increment(1),
              lastSubmittedAt: serverTimestamp(),
              title,
              description,
              category,
              country,
              type,
              tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
              imageUrl: imageUrl || 'https://picsum.photos/seed/placeholder/512/512',
          });

          const updatedDoc = await getDoc(existingDoc.ref);
          const updatedGroup = mapDocToGroupLink(updatedDoc);
          return { message: 'Group submission updated successfully!', group: updatedGroup };
      }
    }

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

    // These should be in your environment variables for security
    const adminUsername = process.env.ADMIN_USERNAME || "hworldplayz";
    const adminPassword = process.env.ADMIN_PASSWORD || "hworldplayz@512";

    if (username === adminUsername && password === adminPassword) {
        return { success: true, message: 'Login successful!' };
    } else {
        return { success: false, message: 'Invalid username or password.' };
    }
}

const newsletterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
  const validatedFields = newsletterSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.email?.[0] || 'Invalid email format.',
    };
  }

  const { email } = validatedFields.data;
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('Mailchimp API Key or Audience ID is not configured.');
    return { success: false, message: 'Newsletter service is not configured. Please contact support.' };
  }
  
  const dc = apiKey.split('-')[1];
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${apiKey}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    });

    if (response.ok) {
      return { success: true, message: "You've successfully subscribed to our newsletter!" };
    } else {
      const data = await response.json();
      if (data.title === 'Member Exists') {
        return { success: true, message: "You're already subscribed!" };
      }
      return { success: false, message: data.detail || 'An unexpected error occurred.' };
    }
  } catch (error) {
    console.error('Mailchimp API error:', error);
    return { success: false, message: 'Failed to subscribe. Please try again later.' };
  }
}
