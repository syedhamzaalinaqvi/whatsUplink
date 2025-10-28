
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Category, Country, GroupLink, ModerationSettings } from '@/lib/data';
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
import { getCategories, getCountries } from '@/app/admin/actions';

type HomePageProps = {
  initialSettings: ModerationSettings;
};

export function HomePage({ initialSettings }: HomePageProps) {
  const { firestore } = useFirestore();
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [visibleCount, setVisibleCount] = useState(initialSettings.groupsPerPage);
  const [isGroupLoading, setIsGroupLoading] = useState(true);
  
  const [settings, setSettings] = useState(initialSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);


  useEffect(() => {
    async function fetchInitialData() {
      if (!firestore) {
        console.log("Firestore not available yet...");
        setIsGroupLoading(true);
        setIsFiltersLoading(true);
        return;
      }
      
      setIsFiltersLoading(true);
      try {
        const [cats, counts] = await Promise.all([getCategories(), getCountries()]);
        setCategories(cats);
        setCountries(counts);
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      } finally {
        setIsFiltersLoading(false);
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
    }
    
    fetchInitialData();

  }, [firestore]);


  const handleGroupSubmitted = (newGroup: GroupLink) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + settings.groupsPerPage);
  };

  const visibleGroups = groups.slice(0, visibleCount);
  const hasMoreGroups = visibleCount < groups.length;
  
  const featuredGroups = useMemo(() => groups.filter(g => g.featured), [groups]);

  const renderFeaturedGroups = () => {
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
      <Header onGroupSubmitted={handleGroupSubmitted} categories={categories} countries={countries} isLoadingFilters={isFiltersLoading} />
      <main className="flex-1 pb-20 md:pb-0">
        
        {featuredGroups.length > 0 && !isGroupLoading && (
          <section className="container py-8 md:py-12">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Featured Groups</h2>
              {renderFeaturedGroups()}
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
            showClicks={settings.showClicks}
            initialCategories={categories}
            initialCountries={countries}
            isLoadingFilters={isFiltersLoading}
        />
      </main>
    </div>
  );
}
