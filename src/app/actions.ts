
'use server';
import { z } from 'zod';
import type { GroupLink, ModerationSettings, Report } from '@/lib/data';
import { getLinkPreview } from 'link-preview-js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment, getDoc, doc, writeBatch } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { getModerationSettings } from '@/app/admin/actions';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import crypto from 'crypto';
import mailchimp from '@mailchimp/mailchimp_marketing';

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
  link: z.string().min(1, { message: 'Please enter a valid WhatsApp link.' }).url({ message: 'Please enter a valid WhatsApp link.' }),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  country: z.string().min(1, 'Please select a country'),
  type: z.enum(['group', 'channel'], { required_error: 'Please select a type' }),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional(),
}).refine(data => {
    if (data.type === 'group') {
        return data.link.startsWith('https://chat.whatsapp.com/');
    }
    if (data.type === 'channel') {
        return data.link.includes('whatsapp.com/channel');
    }
    return false;
}, {
    message: "The link format doesn't match the selected type (group or channel).",
    path: ['link'],
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
    _form?: string[];
  };
};

export async function getGroupPreview(link: string) {
  'use server';
  if (!link || (!link.startsWith('https://chat.whatsapp.com') && !link.includes('whatsapp.com/channel'))) {
    return { error: 'Invalid WhatsApp group or channel link.' };
  }
  try {
    // Automatically add 'www.' for channel links if missing for the preview API
    const previewLink = link.startsWith('https://whatsapp.com/channel') 
        ? link.replace('https://whatsapp.com/channel', 'https://www.whatsapp.com/channel')
        : link;

    const preview = await getLinkPreview(previewLink, {
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
    return { error: 'Could not fetch group preview. The link may be invalid or private.' };
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
  rawData: any
): Promise<FormState> {
  
  const validatedFields = submitGroupSchema.safeParse(rawData);

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
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [],
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
              tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [],
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
    'use server';
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

const reportGroupSchema = z.object({
  groupId: z.string().min(1),
  groupTitle: z.string().min(1),
  reason: z.string().min(1, 'Please select a reason for reporting.'),
  otherReason: z.string().optional(),
}).refine(data => {
    // If reason is 'Other', then otherReason must have content and be at least 10 chars.
    if (data.reason === 'Other') {
        return !!data.otherReason && data.otherReason.trim().length >= 10;
    }
    // For other reasons, validation passes.
    return true;
}, {
    // This message is shown if the .refine() check fails.
    message: "Please provide a detailed reason (at least 10 characters).",
    path: ["otherReason"], // This specifies which field the error message is associated with.
});

export async function reportGroup(formData: FormData): Promise<{ success: boolean; message: string }> {
  const otherReasonValue = formData.get('otherReason');

  const validatedFields = reportGroupSchema.safeParse({
    groupId: formData.get('groupId'),
    groupTitle: formData.get('groupTitle'),
    reason: formData.get('reason'),
    // If otherReason is null (not in form), pass undefined to Zod.
    otherReason: otherReasonValue === null ? undefined : String(otherReasonValue),
  });
  
  if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      const errorMessage = fieldErrors.otherReason?.[0] || 'Invalid report data. Please try again.';
      return { success: false, message: errorMessage };
  }

  const { groupId, groupTitle, reason, otherReason } = validatedFields.data;

  try {
    const db = getFirestoreInstance();
    const reportsCollection = collection(db, 'reports');
    
    // Combine reason and otherReason if 'Other' is selected.
    const finalReason = reason === 'Other' ? `Other: ${otherReason}` : reason;

    const reportData: Omit<Report, 'id' | 'createdAt'> = {
      groupId,
      groupTitle,
      reason: finalReason,
      status: 'pending',
    };
    
    await addDoc(reportsCollection, {
      ...reportData,
      createdAt: serverTimestamp(),
    });

    return { success: true, message: `Thank you for your report. We will review "${groupTitle}" shortly.` };
  } catch (error) {
    console.error('Error submitting report:', error);
    return { success: false, message: 'Failed to submit report. Please try again later.' };
  }
}
