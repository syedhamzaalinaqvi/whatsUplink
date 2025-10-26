'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { initializeFirebase } from '@/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';

const GROUPS_PER_PAGE = 20;

// Initialize Firebase ONCE outside of the component to prevent re-initialization.
const { firestore } = initializeFirebase();

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);
  const [visibleCount, setVisibleCount] = useState(GROUPS_PER_PAGE);
  const [isGroupLoading, setIsGroupLoading] = useState(true);

  useEffect(() => {
    // This effect runs only once on component mount.
    const groupsCollection = collection(firestore, 'groups');
    const q = query(groupsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groupsData = querySnapshot.docs.map(mapDocToGroupLink);
      
      // Sort on the client-side to handle all date formats robustly
      groupsData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });

      setGroups(groupsData);
      setIsGroupLoading(false); // Set loading to false after the first data snapshot
    }, (error) => {
      console.error("Error fetching real-time groups:", error);
      setIsGroupLoading(false); // Also stop loading on error
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once.


  const handleGroupSubmitted = (newGroup: GroupLink) => {
    // The real-time listener will automatically update the `groups` state,
    // so no manual addition to the state is needed here.
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
            isGroupLoading={isGroupLoading}
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
