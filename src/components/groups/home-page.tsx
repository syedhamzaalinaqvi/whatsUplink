
'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
} from "@/components/ui/carousel";
import { SubmitGroupDialog } from './submit-group-dialog';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';

type HomePageProps = {
  initialSettings: ModerationSettings;
  allGroups: GroupLink[];
  initialCategories: Category[];
  initialCountries: Country[];
};

export function HomePage({ 
    initialSettings, 
    allGroups, 
    initialCategories, 
    initialCountries 
}: HomePageProps) {
  const [settings] = useState(initialSettings);
  const [initialSearchTag, setInitialSearchTag] = useState('');
  const pathname = usePathname();
  const isSubmitPage = pathname === '/submit';

  useEffect(() => {
    const tag = sessionStorage.getItem('tagSearch');
    if (tag) {
      setInitialSearchTag(tag);
      sessionStorage.removeItem('tagSearch');
    }
  }, []);
  
  const featuredGroups = useMemo(() => allGroups.filter(g => g.featured), [allGroups]);

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
            allGroups={allGroups}
            showClicks={settings.showClicks}
            initialCategories={initialCategories}
            initialCountries={initialCountries}
            initialSearchQuery={initialSearchTag}
        />
      </main>
      
      {!isSubmitPage && (
          <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <SubmitGroupDialog categories={initialCategories} countries={initialCountries}>
              <Button size="lg" className="rounded-full shadow-lg h-14 text-base">
                <PlusCircle className="mr-2 h-5 w-5" />
                Submit Group
              </Button>
            </SubmitGroupDialog>
          </div>
      )}
    </div>
  );
}
