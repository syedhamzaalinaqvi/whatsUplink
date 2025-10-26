
'use client';

import { useState, useMemo } from 'react';
import { GroupCard } from '@/components/groups/group-card';
import { GroupListControls } from '@/components/groups/group-list-controls';
import type { GroupLink } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { SubmitGroup } from './submit-group';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

type GroupClientPageProps = {
    groups: GroupLink[];
    onGroupSubmitted: (group: GroupLink) => void;
    onLoadMore: () => void;
    hasMore: boolean;
    isGroupLoading: boolean;
};

export function GroupClientPage({ groups, onGroupSubmitted, onLoadMore, hasMore, isGroupLoading }: GroupClientPageProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || 
        group.title.toLowerCase().includes(searchLower) || 
        group.description.toLowerCase().includes(searchLower) ||
        group.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      const countryMatch = selectedCountry === 'all' || group.country === selectedCountry;
      const categoryMatch = selectedCategory === 'all' || group.category.toLowerCase() === selectedCategory.toLowerCase();
      return searchMatch && countryMatch && categoryMatch;
    });
  }, [groups, searchQuery, selectedCountry, selectedCategory]);

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
            submitButton={<SubmitGroup onGroupSubmitted={onGroupSubmitted} />}
        />
        
        {isGroupLoading ? (
             <div 
                className={`transition-all duration-500 ${
                view === 'grid'
                    ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                    : 'flex flex-col gap-6'
                }`}
            >
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className={view === 'grid' ? 'h-40' : 'h-48'} />
                ))}
            </div>
        ) : filteredGroups.length > 0 ? (
            <>
                <div 
                    className={`transition-all duration-500 ${
                    view === 'grid'
                        ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                        : 'flex flex-col gap-6'
                    }`}
                >
                    {filteredGroups.map(group => (
                    <GroupCard key={group.id} group={group} view={view} onTagClick={handleTagClick} />
                    ))}
                </div>
                {hasMore && (
                    <div className="mt-10 flex justify-center">
                        <Button
                            onClick={onLoadMore}
                            variant="default"
                            size="lg"
                            className="transition-all hover:scale-105 active:scale-95"
                        >
                            Load More Groups
                        </Button>
                    </div>
                )}
            </>
        ) : (
            <div className="mt-16 text-center text-muted-foreground">
                <h3 className="text-xl font-semibold">No groups found</h3>
                <p>Try adjusting your filters or submit a new group!</p>
            </div>
        )}
        </div>
    </section>
  );
}
