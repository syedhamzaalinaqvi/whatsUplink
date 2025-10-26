
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { initializeFirebase } from '@/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';

const GROUPS_PER_PAGE = 20;

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);
  const [visibleCount, setVisibleCount] = useState(GROUPS_PER_PAGE);
  const [isGroupLoading, setIsGroupLoading] = useState(true);

  useEffect(() => {
    const { firestore } = initializeFirebase();
    const groupsCollection = collection(firestore, 'groups');
    const q = query(groupsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const groupsData = querySnapshot.docs.map(mapDocToGroupLink);
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
    // We can scroll to the top or give some other feedback if desired.
  };

  const handleLoadMore = () => {
    // We show a loading spinner, but the real loading is handled by the state update
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
            isGroupLoading={isGroupLoading && groups.length === 0} // Show skeleton only on initial load
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
