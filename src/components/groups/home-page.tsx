
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { GroupClientPage } from '@/components/groups/group-client-page';

export function HomePage({ initialGroups }: { initialGroups: GroupLink[] }) {
  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    setGroups(prevGroups => [newGroup, ...prevGroups]);
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
