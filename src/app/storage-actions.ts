
'use server';

import { getFirebaseAdminApp } from '@/firebase/admin-config';

type GetSasUrlPayload = {
  name: string;
  type: string;
  size: number;
};

export async function getStorageSasUrl(payload: GetSasUrlPayload): Promise<{ success: true, sasUrl: string, publicUrl: string } | { success: false, error: string }> {
  try {
    const adminApp = getFirebaseAdminApp();
    const storage = adminApp.storage();
    const bucket = storage.bucket();

    // Use a timestamp and random string to ensure a unique filename
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${payload.name}`;
    const file = bucket.file(`group-logos/${uniqueFileName}`);

    // Set storage options
    const options = {
      version: 'v4' as const,
      action: 'write' as const,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: payload.type,
    };

    // Get a signed URL for uploading
    const [url] = await file.getSignedUrl(options);

    // Construct the public URL for later access
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;

    return {
      success: true,
      sasUrl: url,
      publicUrl: publicUrl,
    };

  } catch (error: any) {
    console.error('Error generating SAS URL:', error);
    return { success: false, error: error.message || 'An unknown error occurred while preparing the upload.' };
  }
}
