
'use server';
import { z } from 'zod';
import type { GroupLink, ModerationSettings, Report } from '@/lib/data';
import { getLinkPreview } from 'link-preview-js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment, getDoc, doc, writeBatch, limit, runTransaction } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { getModerationSettings } from '@/lib/admin-settings';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import crypto from 'crypto';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { submitGroupSchema } from '@/lib/zod-schemas';
import type { FormState } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { differenceInMilliseconds } from 'date-fns';
import { cookies } from 'next/headers';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
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

export async function getGroupPreview(link: string): Promise<{
  success: boolean;
  data?: {
    title: string;
    description: string;
    imageUrl: string;
    imageHint: string;
  };
  error?: string;
}> {
  if (!link || !(link.startsWith('https://chat.whatsapp.com/') || link.startsWith('https://www.whatsapp.com/channel/'))) {
    return { success: false, error: 'Invalid WhatsApp group or channel link.' };
  }
  try {
    const preview = await getLinkPreview(link, {
        followRedirects: 'follow',
    });

    if (!preview || !('title' in preview) || !preview.title) {
        return { success: false, error: 'Could not fetch group preview. Please check the link.' };
    }

    const title = preview.title as string;
    const description = preview.description as string || '';
    const imageUrl = (preview.images?.[0] as string) || (preview.favicons?.[0] as string) || '/whatsuplink_logo_and_favicon_without_background.png';
    const imageHint = title.split(' ').slice(0, 2).join(' ').toLowerCase();

    return { success: true, data: { title, description, imageUrl, imageHint } };
  } catch (error: any) {
    console.error('Error fetching link preview:', error);
    return { success: false, error: 'Failed to fetch group info. The link may be invalid or private.' };
  }
}

function sanitizeAndLimitTags(tagsInput: string | undefined): string[] {
    if (!tagsInput) return [];

    const MAX_TAGS = 10;
    const MAX_TAG_LENGTH = 30;

    return tagsInput
        .split(',')
        .map(tag =>
            tag
                .trim()
                // Remove any character that is not a letter, number, or space
                .replace(/[^a-zA-Z0-9\s]/g, '')
                // Truncate long tags
                .slice(0, MAX_TAG_LENGTH)
                .trim()
        )
        // Filter out any empty tags that might result from sanitization
        .filter(tag => tag.length > 1)
        // Remove duplicate tags
        .filter((tag, index, self) => self.indexOf(tag) === index)
        // Limit the total number of tags
        .slice(0, MAX_TAGS);
}

export async function submitGroup(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = submitGroupSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Please correct the errors in the form.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const { groupId, ...groupData } = validatedFields.data;
  const isUpdate = !!groupId;

  try {
    const db = getFirestoreInstance();
    const tags = sanitizeAndLimitTags(groupData.tags);
    
    // Check for existing group link
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, where("link", "==", groupData.link), limit(1));
    const existingGroupSnapshot = await getDocs(q);
    const existingGroupDoc = existingGroupSnapshot.docs[0];

    const moderationSettings = await getModerationSettings();

    // Cooldown logic
    if (existingGroupDoc && !isUpdate) { // Only apply cooldown for new submissions, not admin edits
      const existingGroup = mapDocToGroupLink(existingGroupDoc);
      if (moderationSettings.cooldownEnabled && existingGroup.lastSubmittedAt) {
        const lastSubmissionDate = new Date(existingGroup.lastSubmittedAt);
        const now = new Date();
        const diff = differenceInMilliseconds(now, lastSubmissionDate);

        let cooldownPeriod = 0;
        switch (moderationSettings.cooldownUnit) {
            case 'hours':
                cooldownPeriod = moderationSettings.cooldownValue * 60 * 60 * 1000;
                break;
            case 'days':
                cooldownPeriod = moderationSettings.cooldownValue * 24 * 60 * 60 * 1000;
                break;
            case 'months':
                // Approximation
                cooldownPeriod = moderationSettings.cooldownValue * 30 * 24 * 60 * 60 * 1000;
                break;
        }

        if (diff < cooldownPeriod) {
            const timeLeft = Math.ceil((cooldownPeriod - diff) / (1000 * 60 * 60)); // in hours
            return { message: `This group was submitted recently. Please wait about ${timeLeft} more hour(s) before submitting again.` };
        }
      }
      
      // Cooldown passed, update the existing group
      const groupRef = doc(db, 'groups', existingGroup.id);
      await updateDoc(groupRef, {
        ...groupData, // update details in case they changed
        tags: tags,
        submissionCount: increment(1),
        lastSubmittedAt: serverTimestamp(), // This is the "bump"
      });

      revalidatePath('/');
      revalidatePath(`/group/invite/${existingGroup.id}`);
      return { message: 'Group re-submitted successfully!', success: true, newGroupId: existingGroup.id };
    }


    if (isUpdate && groupId) {
      // This is an ADMIN UPDATE operation
      const groupRef = doc(db, 'groups', groupId);
      const updateData = {
        ...groupData,
        tags: tags,
      };
      await updateDoc(groupRef, updateData);

      revalidatePath('/admin');
      revalidatePath('/');
      revalidatePath(`/group/invite/${groupId}`);
      return { message: 'Group updated successfully!', success: true, newGroupId: groupId };

    } else {
      // This is a new CREATE operation
      const newGroupData: Partial<GroupLink> = {
        ...groupData,
        tags: tags,
        createdAt: serverTimestamp() as any,
        lastSubmittedAt: serverTimestamp() as any,
        clicks: 0,
        submissionCount: 1,
        featured: false,
        totalRating: 0,
        ratingCount: 0,
      };
      const docRef = await addDoc(collection(db, 'groups'), newGroupData);

      revalidatePath('/');
      revalidatePath(`/group/invite/${docRef.id}`);
      return { message: 'Your group has been submitted successfully!', success: true, newGroupId: docRef.id };
    }

  } catch (error) {
    console.error('Firestore submission error:', error);
    return { message: 'An unexpected error occurred. Please try again.' };
  }
}

const submitRatingSchema = z.object({
  groupId: z.string().min(1),
  rating: z.coerce.number().min(1).max(5),
});

export async function submitRating(formData: FormData): Promise<{ success: boolean; message: string; newAverage?: number }> {
    const validatedFields = submitRatingSchema.safeParse({
        groupId: formData.get('groupId'),
        rating: formData.get('rating'),
    });

    if (!validatedFields.success) {
        return { success: false, message: "Invalid rating data." };
    }
    const { groupId, rating } = validatedFields.data;

    const cookieStore = cookies();
    const ratedGroupsCookie = cookieStore.get('ratedGroups');
    const ratedGroups = ratedGroupsCookie ? JSON.parse(ratedGroupsCookie.value) : [];

    if (ratedGroups.includes(groupId)) {
        return { success: false, message: "You have already rated this group." };
    }
    
    try {
        const db = getFirestoreInstance();
        const groupRef = doc(db, 'groups', groupId);

        let newAverage = 0;
        
        await runTransaction(db, async (transaction) => {
            const groupDoc = await transaction.get(groupRef);
            if (!groupDoc.exists()) {
                throw new Error("Group not found!");
            }
            
            const groupData = groupDoc.data();
            const currentTotalRating = groupData.totalRating || 0;
            const currentRatingCount = groupData.ratingCount || 0;

            const newTotalRating = currentTotalRating + rating;
            const newRatingCount = currentRatingCount + 1;
            newAverage = newTotalRating / newRatingCount;

            transaction.update(groupRef, {
                totalRating: newTotalRating,
                ratingCount: newRatingCount,
            });
        });

        // Set cookie after successful transaction
        ratedGroups.push(groupId);
        cookieStore.set('ratedGroups', JSON.stringify(ratedGroups), {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        
        revalidatePath(`/group/invite/${groupId}`);
        revalidatePath('/');

        return { success: true, message: "Thank you for your rating!", newAverage };

    } catch (error) {
        console.error("Error submitting rating:", error);
        return { success: false, message: "Could not submit your rating. Please try again." };
    }
}
