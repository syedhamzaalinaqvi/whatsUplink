
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, QuerySnapshot, DocumentData, Timestamp, query as firestoreQuery } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { Dialog } from '@/components/ui/dialog';
import { SubmitGroupDialogContent } from '@/components/groups/submit-group-dialog';

// Helper function to safely convert Firestore Timestamps or other date formats to ISO strings
function safeGetDate(createdAt: any): string {
    if (!createdAt) {
        return new Date().toISOString(); // Fallback for missing timestamps
    }
    if (createdAt instanceof Timestamp) {
      return createdAt.toDate().toISOString();
    }
    // Handle cases where it might be a plain object from server-side rendering
    if (typeof createdAt === 'object' && createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toISOString();
    }
    // Fallback for string or number formats
    try {
        const date = new Date(createdAt);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    } catch (e) {
        // Ignore parsing errors and fall back
    }
    return new Date().toISOString();
}


export default function Home() {
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const { firestore } = initializeFirebase();
        const groupsCollection = collection(firestore, 'groups');
        // Removed orderBy for robustness. The query will now fetch all documents without sorting.
        const q = firestoreQuery(groupsCollection);
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No documents found in 'groups' collection.");
            setGroups([]);
        } else {
            console.log(`Found ${querySnapshot.size} documents. Processing...`);
            const groupsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    link: data.link,
                    imageUrl: data.imageUrl,
                    imageHint: data.imageHint || '',
                    category: data.category,
                    country: data.country,
                    tags: data.tags || [],
                    createdAt: safeGetDate(data.createdAt),
                } as GroupLink;
            });
            setGroups(groupsData);
            console.log("Groups loaded successfully:", groupsData);
        }
      } catch (error) {
        console.error("Error fetching groups from Firestore:", error);
        setGroups([]); // In case of an error, ensure groups is an empty array
      } finally {
        setIsLoading(false);
      }
    }

    fetchGroups();
  }, []);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    setGroups(prev => [newGroup, ...prev]);
    setIsSubmitDialogOpen(false);
  };

  return (
    <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1">
          <GroupClientPage initialGroups={groups} isLoading={isLoading} />
        </main>
        <footer className="border-t bg-background">
          <div className="container py-6 text-center text-sm text-muted-foreground">
            Built for WhatsUpLink. &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </div>
      <SubmitGroupDialogContent onGroupSubmitted={handleGroupSubmitted} />
    </Dialog>
  );
}
