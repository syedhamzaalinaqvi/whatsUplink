
'use server';
import { z } from 'zod';
import type { GroupLink, ModerationSettings } from '@/lib/data';
import { getLinkPreview } from 'link-preview-js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment, getDoc, doc, writeBatch } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { getModerationSettings } from '@/app/admin/actions';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import crypto from 'crypto';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { getStorage, ref, getSignedUrl } from 'firebase-admin/storage';
import { getFirebaseAdminApp } from '@/firebase/admin-config';

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
        'X-Link-Preview-Api-Key': process.env.LINK_PREVIEW_API_KEY,
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
        cooldownMs = cooldownValue * 24 * 60 * 60 * 1000; // Approximation
    } else if (cooldownUnit === 'months') {
        cooldownMs = cooldownValue * 30 * 24 * 60 * 60 * 1000; // Approximation
    }
    return cooldownMs;
}

// Function to add a new group document
async function addNewGroup(groupData: Omit<GroupLink, 'id' | 'createdAt' | 'lastSubmittedAt' | 'submissionCount' | 'showClicks'>) {
    const db = getFirestoreInstance();
    const groupsCollection = collection(db, 'groups');
    
    const newGroupData = {
        ...groupData,
        createdAt: serverTimestamp(),
        lastSubmittedAt: serverTimestamp(),
        submissionCount: 1,
        clicks: 0,
        featured: false,
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
  
  try {
    const db = getFirestoreInstance();
    const moderationSettings = await getModerationSettings();
    const groupsCollection = collection(db, 'groups');
    
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
    
    const q = query(groupsCollection, where('link', '==', link));
    const querySnapshot = await getDocs(q);
    const existingDocs = querySnapshot.docs;

    // Logic when cooldown is DISABLED
    if (!moderationSettings.cooldownEnabled) {
        const newGroup = await addNewGroup(newGroupPayload);
        
        // Update submission count for all other existing groups with the same link
        if (existingDocs.length > 0) {
            const batch = writeBatch(db);
            existingDocs.forEach(doc => {
                batch.update(doc.ref, { submissionCount: increment(1) });
            });
            await batch.commit();
        }
        
        return { message: 'Group submitted successfully!', group: newGroup };
    }

    // Logic when cooldown is ENABLED
    if (querySnapshot.empty) {
      // Link is new, so add it with submission count 1.
      const newGroup = await addNewGroup(newGroupPayload);
      return { message: 'Group submitted successfully!', group: newGroup };
    } else {
      // Link exists, check the cooldown on the most recently submitted one.
      const mostRecentDoc = existingDocs.sort((a, b) => b.data().lastSubmittedAt.toMillis() - a.data().lastSubmittedAt.toMillis())[0];
      const mostRecentGroupData = mapDocToGroupLink(mostRecentDoc);
      
      const lastSubmitted = mostRecentGroupData.lastSubmittedAt ? new Date(mostRecentGroupData.lastSubmittedAt).getTime() : 0;
      const cooldownMs = calculateCooldown(moderationSettings);

      if (Date.now() - lastSubmitted < cooldownMs) {
          const timeLeft = cooldownMs - (Date.now() - lastSubmitted);
          const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
          return { message: `You have already submitted this link recently. Please try again in about ${hoursLeft} hour(s).` };
      } else {
          // Cooldown has passed, update the MOST RECENT existing document.
          // Note: We update, not create a new one, in cooldown mode.
          await updateDoc(mostRecentDoc.ref, {
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
          
          const updatedDoc = await getDoc(mostRecentDoc.ref);
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
    require('dotenv').config({ path: '.env.local' });
    const validatedFields = loginSchema.safeParse({
        username: formData.get('username'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }

    const { username, password } = validatedFields.data;

    // These should be in your environment variables for security
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (username === adminUsername && password === adminPassword) {
        return { success: true, message: 'Login successful!' };
    } else {
        return { success: false, message: 'Invalid username or password.' };
    }
}

const newsletterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export async function subscribeToNewsletter(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const validatedFields = newsletterSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message:
        validatedFields.error.flatten().fieldErrors.email?.[0] ||
        'Invalid email format.',
    };
  }
  const { email } = validatedFields.data;

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('Mailchimp API Key or Audience ID is not configured.');
    return {
      success: false,
      message: 'Newsletter service is not configured. Please contact support.',
    };
  }

  const serverPrefix = apiKey.split('-')[1];
  if (!serverPrefix) {
    console.error('Could not extract server prefix from Mailchimp API Key.');
    return { success: false, message: 'Invalid Mailchimp API Key format.' };
  }

  mailchimp.setConfig({
    apiKey: apiKey,
    server: serverPrefix,
  });

  try {
    const response = await mailchimp.lists.setListMember(audienceId, 
        crypto.createHash('md5').update(email.toLowerCase()).digest('hex'),
        {
            email_address: email,
            status: 'subscribed',
        }
    );
    return { success: true, message: "You've been successfully subscribed!" };

  } catch (error: any) {
    if (error.response?.body?.title === 'Member Exists') {
        return { success: true, message: "You're already subscribed. Thanks for being with us!" };
    }

    console.error('Mailchimp API Error:', error.response?.body || error);
    return {
      success: false,
      message: 'Failed to subscribe. Please try again later.',
    };
  }
}

export async function getStorageSasUrl(file: {
  name: string;
  type: string;
  size: number;
}) {
  'use server';
  try {
    const app = getFirebaseAdminApp();
    const storage = getStorage(app);
    const bucket = storage.bucket();

    const filePath = `logos/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    const fileRef = bucket.file(storageRef.fullPath);

    const [sasUrl] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: file.type,
    });

    // Get public URL after upload
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    return {
      success: true,
      sasUrl,
      publicUrl,
    };
  } catch (e: any) {
    console.error('SAS URL generation failed:', e);
    return {
      success: false,
      error: e.message || 'Could not get upload URL.',
    };
  }
}

    

    

