
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { useFirestore } from '@/firebase/provider';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';
import { GroupCard } from './group-card';
import { Separator } from '../ui/separator';

const GROUPS_PER_PAGE = 20;

export function HomePage() {
  const { firestore } = useFirestore();
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [visibleCount, setVisibleCount] = useState(GROUPS_PER_PAGE);
  const [isGroupLoading, setIsGroupLoading] = useState(true);

  useEffect(() => {
    if (!firestore) {
      console.log("Firestore not available yet...");
      return;
    }
    
    setIsGroupLoading(true);
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

    return () => unsubscribe();
  }, [firestore]);


  const handleGroupSubmitted = (newGroup: GroupLink) => {
    // The real-time listener will automatically update the `groups` state,
    // so no manual addition to the state is needed here.
    // We can scroll to the top to show the new group.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + GROUPS_PER_PAGE);
  };

  const visibleGroups = groups.slice(0, visibleCount);
  const hasMoreGroups = visibleCount < groups.length;
  
  const featuredGroups = useMemo(() => groups.filter(g => g.featured), [groups]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header onGroupSubmitted={handleGroupSubmitted} />
      <main className="flex-1 pb-20 md:pb-0">
        
        {featuredGroups.length > 0 && (
          <section className="container py-8 md:py-12">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Featured Groups</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
                {featuredGroups.map(group => (
                  <GroupCard key={group.id} group={group} view="grid" onTagClick={() => {}} />
                ))}
              </div>
              <Separator className="my-8" />
            </div>
          </section>
        )}

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
