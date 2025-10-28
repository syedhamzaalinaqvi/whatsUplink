
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const GROUPS_PER_PAGE = 20;

type HomePageProps = {
  initialShowClicks: boolean;
};

export function HomePage({ initialShowClicks }: HomePageProps) {
  const { firestore } = useFirestore();
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [visibleCount, setVisibleCount] = useState(GROUPS_PER_PAGE);
  const [isGroupLoading, setIsGroupLoading] = useState(true);
  
  // The global `showClicks` setting is now managed here as state.
  // It is initialized by the server and can be updated by client-side actions if needed.
  const [showClicks, setShowClicks] = useState(initialShowClicks);

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
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {featuredGroups.map((group) => (
                    <CarouselItem key={group.id} className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                       <GroupCard group={group} view="grid" onTagClick={() => {}} showClicks={showClicks} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
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
            showClicks={showClicks}
        />
      </main>
    </div>
  );
}
