
'use client';

import { useState, useMemo, useLayoutEffect, useEffect } from 'react';
import { GroupCard } from '@/components/groups/group-card';
import { GroupListControls } from '@/components/groups/group-list-controls';
import type { Category, Country, GroupLink, ModerationSettings } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

type GroupClientPageProps = {
    allGroups: GroupLink[];
    initialSettings: ModerationSettings;
    initialCategories: Category[];
    initialCountries: Country[];
    initialSearchQuery?: string;
    isLoading?: boolean; // Prop to indicate if data is loading server-side
};

export function GroupClientPage({
  allGroups,
  initialSettings,
  initialCategories,
  initialCountries,
  initialSearchQuery = '',
  isLoading: isInitiallyLoading = false, // Default to false
}: GroupClientPageProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'group' | 'channel'>('all');
  
  const [visibleCount, setVisibleCount] = useState(initialSettings.groupsPerPage);

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [countries, setCountries] = useState<Country[]>(initialCountries);
  
  // Use a separate state for loading to avoid re-triggering skeletons on filter change
  const [isLoading, setIsLoading] = useState(isInitiallyLoading);

  // Restore scroll position on mount
  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition, 10));
        sessionStorage.removeItem('scrollPosition');
      }, 0);
    }
  }, []);

  // When allGroups prop updates, turn off the loading state
  useEffect(() => {
    setIsLoading(false);
  }, [allGroups]);

  // Update categories and countries if they change
  useEffect(() => {
    setCategories(initialCategories);
    setCountries(initialCountries);
  }, [initialCategories, initialCountries]);

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };
  
  const handleLoadMore = () => {
    setVisibleCount(prevCount => prevCount + initialSettings.groupsPerPage);
  };

  const filteredGroups = useMemo(() => {
    return allGroups.filter(group => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        group.title.toLowerCase().includes(searchLower) || 
        group.description.toLowerCase().includes(searchLower) ||
        group.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      const countryMatch = selectedCountry === 'all' || group.country === selectedCountry;
      const categoryMatch = selectedCategory === 'all' || group.category.toLowerCase() === selectedCategory.toLowerCase();
      const typeMatch = selectedType === 'all' || group.type === selectedType;
      return searchMatch && countryMatch && categoryMatch && typeMatch;
    });
  }, [allGroups, searchQuery, selectedCountry, selectedCategory, selectedType]);

  const visibleGroups = useMemo(() => {
    return filteredGroups.slice(0, visibleCount);
  }, [filteredGroups, visibleCount]);

  const gridClass = view === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4' : 'flex flex-col gap-6';

  return (
    <section className="container py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
        <GroupListControls 
            view={view}
            onViewChange={setView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            categories={categories}
            countries={countries}
            isLoadingFilters={false} // Data is now pre-loaded
        />
        
        {isLoading ? (
            <div className={gridClass}>
                {Array.from({ length: initialSettings.groupsPerPage }).map((_, i) => (
                    <Skeleton key={i} className={view === 'grid' ? 'h-40' : 'h-48'} />
                ))}
            </div>
        ) : allGroups.length === 0 ? ( // Check initial `allGroups` first
             <div className="mt-16 text-center text-muted-foreground">
                <h3 className="text-xl font-semibold">No groups found</h3>
                <p>Try adjusting your filters or submit a new group!</p>
            </div>
        ) : visibleGroups.length > 0 ? (
            <div className={gridClass}>
                {visibleGroups.map(group => (
                    <GroupCard key={group.id} group={group} view={view} onTagClick={handleTagClick} showClicks={initialSettings.showClicks} />
                ))}
            </div>
        ) : (
            <div className="mt-16 text-center text-muted-foreground">
                <h3 className="text-xl font-semibold">No groups found</h3>
                <p>Try adjusting your filters or submit a new group!</p>
            </div>
        )}

        {filteredGroups.length > visibleCount && (
            <div className="mt-12 text-center">
                <Button onClick={handleLoadMore} size="lg">
                    Load More Groups
                </Button>
            </div>
        )}
        </div>
    </section>
  );
}
