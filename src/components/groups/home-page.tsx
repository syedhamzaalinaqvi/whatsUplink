
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Category, Country, GroupLink, ModerationSettings } from '@/lib/data';
import { GroupClientPage } from '@/components/groups/group-client-page';
import { GroupCard } from './group-card';
import { Separator } from '../ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Skeleton } from '../ui/skeleton';
import { getPaginatedGroups } from '@/app/admin/actions';
import { useFirestore } from '@/firebase/provider';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { mapDocToGroupLink } from '@/lib/data';

type HomePageProps = {
  initialSettings: ModerationSettings;
  initialGroups: GroupLink[];
  initialCategories: Category[];
  initialCountries: Country[];
};

export function HomePage({ 
    initialSettings, 
    initialGroups, 
    initialCategories, 
    initialCountries 
}: HomePageProps) {
  const { firestore } = useFirestore();
  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);
  const [settings] = useState(initialSettings);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  
  // This state is managed by the real-time listener now.
  // We assume there's always more to load unless the listener returns fewer than expected.
  const [hasMore, setHasMore] = useState(initialGroups.length === settings.groupsPerPage);

  const [initialSearchTag, setInitialSearchTag] = useState('');

  useEffect(() => {
    const tag = sessionStorage.getItem('tagSearch');
    if (tag) {
      setInitialSearchTag(tag);
      sessionStorage.removeItem('tagSearch');
    }
  }, []);
  
  // REAL-TIME LISTENER
  useEffect(() => {
    if (!firestore) return;

    // Listen to all groups, ordered by creation date
    const q = query(collection(firestore, 'groups'), orderBy('createdAt', 'desc'));

    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const serverGroups = querySnapshot.docs.map(g => {
        const group = mapDocToGroupLink(g);
        // Ensure the global setting is applied to real-time data
        group.showClicks = settings.showClicks; 
        return group;
      });
      
      setGroups(serverGroups);
      setIsGroupLoading(false);
    }, (error) => {
      console.error("Error fetching real-time groups:", error);
      setIsGroupLoading(false);
    });

    // Cleanup: Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, [firestore, settings.showClicks]); // Rerun if firestore instance or showClicks setting changes


  const handleLoadMore = async () => {
    if (!groups.length) return;

    setIsGroupLoading(true);
    const lastGroupCursor = groups[groups.length - 1]?.id;
    const { groups: newGroups, hasNextPage } = await getPaginatedGroups(
      settings.groupsPerPage,
      'next',
      lastGroupCursor
    );
    
    // To prevent duplicates with real-time listeners, we'll check for existing IDs
    setGroups(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        const filteredNewGroups = newGroups.filter(g => !existingIds.has(g.id));
        return [...prev, ...filteredNewGroups];
    });

    setHasMore(hasNextPage);
    setIsGroupLoading(false);
  };
  
  const featuredGroups = useMemo(() => groups.filter(g => g.featured), [groups]);

  const renderFeaturedGroups = () => {
    if (featuredGroups.length === 0) return null;

    if (settings.featuredGroupsDisplay === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
          {featuredGroups.map(group => (
            <GroupCard key={group.id} group={group} view="grid" onTagClick={() => {}} showClicks={settings.showClicks} />
          ))}
        </div>
      );
    }

    if (settings.featuredGroupsDisplay === 'list') {
      return (
        <div className="flex flex-col gap-6">
          {featuredGroups.map(group => (
            <GroupCard key={group.id} group={group} view="list" onTagClick={() => {}} showClicks={settings.showClicks} />
          ))}
        </div>
      );
    }
    
    // Default to 'slider'
    return (
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
                <GroupCard group={group} view="grid" onTagClick={() => {}} showClicks={settings.showClicks} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    );
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1 pb-20 md:pb-0">
        <section className="bg-card/50 border-b border-primary/20">
            <div className="container py-12 md:py-16 text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                The Ultimate WhatsApp Group Directory
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                Discover and join thousands of WhatsApp groups and channels from around the world. Submit your own and connect with new communities!
              </p>
            </div>
        </section>
        
        {featuredGroups.length > 0 && (
          <section className="container py-8 md:py-12">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Featured Groups</h2>
              {renderFeaturedGroups()}
              <Separator className="my-8" />
            </div>
          </section>
        )}

        <GroupClientPage 
            groups={groups} 
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isGroupLoading={isGroupLoading}
            showClicks={settings.showClicks}
            initialCategories={initialCategories}
            initialCountries={initialCountries}
            isLoadingFilters={false}
            initialSearchQuery={initialSearchTag}
        />
      </main>
    </div>
  );
}
