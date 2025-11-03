
'use server';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { ModerationSettings } from '@/lib/data';

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

export async function getModerationSettings(): Promise<ModerationSettings> {
    try {
        const db = getFirestoreInstance();
        const settingsDocRef = doc(db, 'settings', 'moderation');
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Return existing data with defaults for any missing fields
            return {
                cooldownEnabled: data.cooldownEnabled ?? true,
                cooldownValue: data.cooldownValue ?? 6,
                cooldownUnit: data.cooldownUnit ?? 'hours',
                showClicks: data.showClicks ?? true,
                groupsPerPage: data.groupsPerPage ?? 20,
                featuredGroupsDisplay: data.featuredGroupsDisplay ?? 'slider',
                showNewsletter: data.showNewsletter ?? false,
            };
        } else {
            // If the document doesn't exist, create it with default values
            const defaultSettings: ModerationSettings = {
                cooldownEnabled: true,
                cooldownValue: 6,
                cooldownUnit: 'hours',
                showClicks: true,
                groupsPerPage: 20,
                featuredGroupsDisplay: 'slider',
                showNewsletter: false,
            };
            await setDoc(settingsDocRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error fetching moderation settings:', error);
    }
    // Return default settings if not found or on error
    return {
        cooldownEnabled: true,
        cooldownValue: 6,
        cooldownUnit: 'hours',
        showClicks: true,
        groupsPerPage: 20,
        featuredGroupsDisplay: 'slider',
        showNewsletter: false,
    };
}
