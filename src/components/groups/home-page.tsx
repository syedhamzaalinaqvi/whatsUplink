
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>([]);

  useEffect(() => {
    // Sort the initial groups when the component mounts
    const sortedGroups = [...initialGroups].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Sort descending (newest first)
    });
    setGroups(sortedGroups);
  }, [initialGroups]);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    // Add the new group to the top and re-sort
    setGroups(prevGroups => {
        const updatedGroups = [newGroup, ...prevGroups];
        return updatedGroups.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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
