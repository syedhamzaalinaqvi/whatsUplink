
'use server';
import { z } from 'zod';
import type { GroupLink, ModerationSettings, Report } from '@/lib/data';
import { getLinkPreview } from 'link-preview-js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, increment, getDoc, doc, writeBatch } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { getModerationSettings } from '@/lib/admin-settings';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import crypto from 'crypto';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { submitGroupSchema } from '@/lib/zod-schemas';
import type { FormState } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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
