
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category, Country, GroupLink, LayoutSettings, ModerationSettings } from '@/lib/data';
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
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { SeoContent } from '../layout/seo-content';
import { Breadcrumbs, type BreadcrumbItem } from '../layout/breadcrumbs';

type HomePageProps = {
  initialSettings: ModerationSettings & { layout: LayoutSettings };
  allGroups: GroupLink[];
  initialCategories: Category[];
  initialCountries: Country[];
  pageTitle?: string;
  breadcrumbItems?: BreadcrumbItem[];
  seoTitle?: string;
  seoContent?: string;
};

export function HomePage({ 
    initialSettings, 
    allGroups, 
    initialCategories, 
    initialCountries,
    pageTitle,
    breadcrumbItems,
    seoTitle,
    seoContent,
}: HomePageProps) {
  const [settings] = useState(initialSettings);
  const [initialSearchTag, setInitialSearchTag] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSubmitPage = pathname === '/submit';

  // This function now simply updates the URL to open the dialog,
  // which is managed by the Header component.
  const handleOpenSubmitDialog = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('submit-form', 'true');
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const tag = sessionStorage.getItem('tagSearch');
    if (tag) {
      setInitialSearchTag(tag);
      sessionStorage.removeItem('tagSearch');
    }
  }, []);
  
  const featuredGroups = useMemo(() => allGroups.filter(g => g.featured), [allGroups]);
  const isDynamicPage = !!pageTitle;

  const renderFeaturedGroups = () => {
    if (featuredGroups.length === 0) return null;

    if (settings.featuredGroupsDisplay === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
          {featuredGroups.map(group => (
            <GroupCard key={group.id} group={group} view="grid" onTagClick={() => {}} showClicks={settings.showClicks} showRatings={settings.showRatings} />
          ))}
        </div>
      );
    }

    if (settings.featuredGroupsDisplay === 'list') {
      return (
        <div className="flex flex-col gap-6">
          {featuredGroups.map(group => (
            <GroupCard key={group.id} group={group} view="list" onTagClick={() => {}} showClicks={settings.showClicks} showRatings={settings.showRatings} />
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
                <GroupCard group={group} view="grid" onTagClick={() => {}} showClicks={settings.showClicks} showRatings={settings.showRatings} />
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
      {breadcrumbItems && <Breadcrumbs items={breadcrumbItems} />}
      <main className="flex-1 pb-20 md:pb-0">
        <section className="bg-card/50 border-b border-primary/20">
            <div className="container py-12 md:py-16 text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground">
                {pageTitle || 'The Ultimate WhatsApp Group Directory'}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                {isDynamicPage
                  ? `Browse all groups in this collection. Use the filters below to narrow your search.`
                  : `Discover and join thousands of WhatsApp groups and channels from around the world. Submit your own and connect with new communities!`}
              </p>
               <div className="mt-8 hidden md:flex items-center justify-center">
                    <Button size="lg" className="h-12 text-lg px-8" onClick={handleOpenSubmitDialog}>
                        <PlusCircle className="mr-2 h-6 w-6" />
                        Submit Group
                    </Button>
                </div>
            </div>
        </section>
        
        {featuredGroups.length > 0 && !isDynamicPage && (
          <section className="container py-8 md:py-12">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Featured Groups</h2>
              {renderFeaturedGroups()}
              <Separator className="my-8" />
            </div>
          </section>
        )}

        {/* Use Suspense to handle the initial loading state for allGroups */}
        <Suspense fallback={<div>Loading...</div>}>
            <GroupClientPage 
                allGroups={allGroups}
                initialSettings={settings}
                initialCategories={initialCategories}
                initialCountries={initialCountries}
                initialSearchQuery={initialSearchTag}
                isLoading={allGroups.length === 0 && !isDynamicPage} 
            />
        </Suspense>

        {/* Show static SEO content on homepage, or dynamic SEO content on category/country pages */}
        {!isDynamicPage && settings.layout.seoContent.enabled && (
            <SeoContent 
                heading={settings.layout.seoContent.heading}
                content={settings.layout.seoContent.content}
            />
        )}
        {isDynamicPage && settings.showDynamicSeoContent && seoTitle && seoContent && (
             <SeoContent 
                heading={seoTitle}
                content={seoContent}
            />
        )}
      </main>
      
      {!isSubmitPage && (
          <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <Button size="lg" className="rounded-full shadow-lg h-14 text-base" onClick={handleOpenSubmitDialog}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Submit Group
            </Button>
          </div>
      )}
    </div>
  );
}
