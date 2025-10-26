
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';

const GROUPS_PER_PAGE = 20;

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [visibleCount, setVisibleCount] = useState(GROUPS_PER_PAGE);
  const [isGroupLoading, setIsGroupLoading] = useState(false);

  useEffect(() => {
    // This function attempts to create a reliable Date object from various formats
    const getSafeDate = (createdAt: any): Date => {
      if (!createdAt) return new Date(0); // Oldest possible date for sorting
      if (createdAt instanceof Date) return createdAt;
      if (typeof createdAt === 'string') return new Date(createdAt);
      // Handle Firestore Timestamp-like objects from server { _seconds, _nanoseconds }
      if (createdAt && typeof createdAt.seconds === 'number' && typeof createdAt.nanoseconds === 'number') {
        return new Date(createdAt.seconds * 1000);
      }
      return new Date(0);
    };

    const sortedGroups = [...initialGroups].sort((a, b) => {
      const dateA = getSafeDate(a.createdAt).getTime();
      const dateB = getSafeDate(b.createdAt).getTime();
      return dateB - dateA; // Sort descending (newest first)
    });
    setGroups(sortedGroups);
  }, [initialGroups]);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    setGroups(prevGroups => {
        const updatedGroups = [newGroup, ...prevGroups];
        // No need to re-sort here as it's already at the top.
        return updatedGroups;
    });
    // If the view is full, add one to the visible count to show the new item
    if (visibleCount % GROUPS_PER_PAGE === 0) {
      setVisibleCount(prev => prev + 1);
    }
  };

  const handleLoadMore = () => {
    setIsGroupLoading(true);
    // Simulate a short delay to show loading animation
    setTimeout(() => {
      setVisibleCount(prevCount => prevCount + GROUPS_PER_PAGE);
      setIsGroupLoading(false);
    }, 500);
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
