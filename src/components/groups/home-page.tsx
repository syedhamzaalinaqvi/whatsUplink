'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { initializeFirebase } from '@/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';

const GROUPS_PER_PAGE = 20;

const getSafeDate = (date: string | Date | null | undefined): Date => {
  if (!date) return new Date(0); // Return epoch for null/undefined to sort them last
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);
  const [visibleCount, setVisibleCount] = useState(GROUPS_PER_PAGE);
  const [isGroupLoading, setIsGroupLoading] = useState(true);

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const groupsCollection = collection(firestore, 'groups');
    // Fetch all groups without ordering at the DB level
    const q = query(groupsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groupsData = querySnapshot.docs.map(mapDocToGroupLink);
      
      // Sort on the client-side to handle missing dates correctly
      groupsData.sort((a, b) => {
        const dateA = getSafeDate(a.createdAt).getTime();
        const dateB = getSafeDate(b.createdAt).getTime();
        return dateB - dateA; // Newest first
      });

      setGroups(groupsData);
      setIsGroupLoading(false);
    }, (error) => {
      console.error("Error fetching real-time groups:", error);
      setIsGroupLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  const handleGroupSubmitted = (newGroup: GroupLink) => {
    // No longer need to manually add to state.
    // The real-time listener will automatically update the `groups` state.
  };

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + GROUPS_PER_PAGE);
  };

  const visibleGroups = groups.slice(0, visibleCount);
  const hasMoreGroups = visibleCount < groups.length;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header onGroupSubmitted={handleGroupSubmitted} />
      <main className="flex-1">
        <GroupClientPage 
            groups={visibleGroups} 
            onGroupSubmitted={handleGroupSubmitted}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreGroups}
            isGroupLoading={isGroupLoading && groups.length === 0}
        />
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          Built for WhatsUpLink. &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
