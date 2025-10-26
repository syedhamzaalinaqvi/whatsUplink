
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
      if (!createdAt) return new Date(0); // For items with no date
      if (createdAt instanceof Date) return createdAt;
      if (typeof createdAt === 'string') {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) return d;
      }
      // Handle Firestore Timestamp-like objects from server { _seconds, _nanoseconds } or { seconds, nanoseconds }
      if (createdAt && (typeof createdAt.seconds === 'number' || typeof createdAt._seconds === 'number')) {
        const seconds = 'seconds' in createdAt ? createdAt.seconds : createdAt._seconds;
        return new Date(seconds * 1000);
      }
      return new Date(0); // Fallback for any other unexpected format
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
        // Add the new group and re-sort immediately
        const updatedGroups = [newGroup, ...prevGroups];
        const getSafeDate = (createdAt: any): Date => {
            if (!createdAt) return new Date(0);
            if (createdAt instanceof Date) return createdAt;
            if (typeof createdAt === 'string') return new Date(createdAt);
            if (createdAt && (typeof createdAt.seconds === 'number' || typeof createdAt._seconds === 'number')) {
              const seconds = 'seconds' in createdAt ? createdAt.seconds : createdAt._seconds;
              return new Date(seconds * 1000);
            }
            return new Date(0);
        };
        return updatedGroups.sort((a, b) => getSafeDate(b.createdAt).getTime() - getSafeDate(a.createdAt).getTime());
    });
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
