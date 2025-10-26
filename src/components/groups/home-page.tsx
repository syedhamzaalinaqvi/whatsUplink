
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';

/**
 * Safely converts various date/timestamp formats into a comparable number.
 * @param createdAt - The value to parse (can be a string, a Date object, a Firestore-like object, or null).
 * @returns A number representing the milliseconds since the epoch, or 0 for invalid/missing dates.
 */
function getSafeDate(createdAt: any): number {
  if (!createdAt) {
    return 0; // Puts items without a date at the very end when sorting descending
  }
  // Case 1: Already a Date object or a valid date string
  const date = new Date(createdAt);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }
  // Case 2: Firestore-like object from server-side rendering (e.g., { _seconds: ..., _nanoseconds: ... })
  if (createdAt && typeof createdAt === 'object' && createdAt._seconds !== undefined) {
    return new Date(createdAt._seconds * 1000).getTime();
  }
  return 0;
}

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>([]);

  useEffect(() => {
    // Sort the initial groups when the component mounts
    const sortedGroups = [...initialGroups].sort((a, b) => {
      const dateA = getSafeDate(a.createdAt);
      const dateB = getSafeDate(b.createdAt);
      return dateB - dateA; // Sort descending (newest first)
    });
    setGroups(sortedGroups);
  }, [initialGroups]);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    // Add the new group to the top and re-sort
    setGroups(prevGroups => {
        const updatedGroups = [newGroup, ...prevGroups];
        return updatedGroups.sort((a, b) => {
            const dateA = getSafeDate(a.createdAt);
            const dateB = getSafeDate(b.createdAt);
            return dateB - dateA; // Sort descending (newest first)
        });
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header onGroupSubmitted={handleGroupSubmitted} />
      <main className="flex-1">
        <GroupClientPage groups={groups} onGroupSubmitted={handleGroupSubmitted} />
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          Built for WhatsUpLink. &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
