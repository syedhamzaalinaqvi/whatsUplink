
'use server';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { ModerationSettings } from '@/lib/data';

// Helper function to initialize Firebase on the server
function getFirestoreInstance() {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

export async function getModerationSettings(): Promise<ModerationSettings> {
    const defaultSettings: ModerationSettings = {
        cooldownEnabled: true,
        cooldownValue: 6,
        cooldownUnit: 'hours',
        showClicks: true,
        groupsPerPage: 20,
        showFeatured: true,
        featuredGroupsDisplay: 'slider',
        showNewsletter: false,
        showDynamicSeoContent: true,
        showRatings: true,
        showTicker: true,
        tickerSpeed: 40,
    };

    try {
        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'moderation');
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Return existing data with defaults for any missing fields
            return {
                ...defaultSettings,
                ...data,
            };
        } else {
            // If the document doesn't exist, create it with default values
            await setDoc(settingsDocRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error fetching moderation settings:', error);
        // Return default settings if not found or on error
        return defaultSettings;
    }
}
