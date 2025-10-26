'use client';

import { useState, useMemo } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Header } from '@/components/layout/header';
import { GroupCard } from '@/components/groups/group-card';
import { GroupListControls } from '@/components/groups/group-list-controls';
import { SubmitGroupDialogContent } from '@/components/groups/submit-group-dialog';
import { sampleGroupLinks, type GroupLink } from '@/lib/data';

export default function Home() {
  const [groups, setGroups] = useState<GroupLink[]>(sampleGroupLinks);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    setGroups(prev => [newGroup, ...prev]);
    setIsSubmitDialogOpen(false);
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const searchMatch = !searchQuery || group.title.toLowerCase().includes(searchQuery.toLowerCase()) || group.description.toLowerCase().includes(searchQuery.toLowerCase());
      const countryMatch = selectedCountry === 'all' || group.country === selectedCountry;
      const categoryMatch = selectedCategory === 'all' || group.category.toLowerCase() === selectedCategory.toLowerCase();
      return searchMatch && countryMatch && categoryMatch;
    });
  }, [groups, searchQuery, selectedCountry, selectedCategory]);

  return (
    <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1">
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
              />
              
              <div 
                className={`transition-all duration-500 ${
                  view === 'grid'
                    ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                    : 'flex flex-col gap-6'
                }`}
              >
                {filteredGroups.map(group => (
                  <GroupCard key={group.id} group={group} view={view} />
                ))}
              </div>

              {filteredGroups.length === 0 && (
                <div className="mt-16 text-center text-muted-foreground">
                  <h3 className="text-xl font-semibold">No groups found</h3>
                  <p>Try adjusting your filters or submit a new group!</p>
                </div>
              )}
            </div>
          </section>
        </main>
        <footer className="border-t bg-background">
          <div className="container py-6 text-center text-sm text-muted-foreground">
            Built for WhatsUpLink. &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </div>
      <SubmitGroupDialogContent onGroupSubmitted={handleGroupSubmitted} />
    </Dialog>
  );
}
