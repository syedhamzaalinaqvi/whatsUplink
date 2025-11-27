'use server';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';
import { getAuth } from 'firebase/auth';

// This is a simplified, temporary approach to generating a signed URL-like functionality on the client.
// In a real-world scenario with security rules, you would use a server-side process
// (like a Cloud Function) to generate a true signed URL for secure, temporary access.
// However, for this project's scope where storage is public, we can construct the public URL directly.

function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

type GetSasUrlPayload = {
  name: string;
  type: string;
  size: number;
};

// This function is being repurposed. It no longer generates a SAS URL.
// Instead, it simulates the process and returns the predictable public URL.
// The actual upload will happen on the client using the standard Firebase SDK.
export async function getStoragePublicUrl(filePath: string): Promise<{ success: true, publicUrl: string } | { success: false, error: string }> {
  try {
    const app = getFirebaseApp();
    const storage = getStorage(app);
    const storageRef = ref(storage, filePath);

    // Get the download URL
    const publicUrl = await getDownloadURL(storageRef);

    return {
      success: true,
      publicUrl: publicUrl,
    };

  } catch (error: any) {
    console.error('Error generating public URL:', error);
    // Firebase storage errors for object-not-found might be okay during initial upload planning
    if (error.code === 'storage/object-not-found') {
        // Construct the URL manually as a fallback for new files
        const bucket = firebaseConfig.storageBucket;
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
         return {
            success: true,
            publicUrl: publicUrl,
        };
    }
    return { success: false, error: error.message || 'An unknown error occurred while preparing the upload.' };
  }
}