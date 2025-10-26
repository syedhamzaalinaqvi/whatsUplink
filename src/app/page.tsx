'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Header } from '@/components/layout/header';
import { GroupCard } from '@/components/groups/group-card';
import { GroupListControls } from '@/components/groups/group-list-controls';
import { SubmitGroupDialogContent } from '@/components/groups/submit-group-dialog';
import type { GroupLink } from '@/lib/data';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, orderBy, query as firestoreQuery, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      setIsLoading(true);
      try {
        const { firestore } = initializeFirebase();
        const groupsCollection = collection(firestore, 'groups');
        const q = firestoreQuery(groupsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        console.log(`Found ${querySnapshot.docs.length} documents.`);

        const groupsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          let createdAt: string;
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            // Handle cases where it's a Timestamp-like object from a different context
            createdAt = data.createdAt.toDate().toISOString();
          } else if (data.createdAt) {
            // Fallback for string or number formats - this may need adjustment
            createdAt = new Date(data.createdAt).toISOString();
          } else {
            // If createdAt is missing, use current time as a fallback
            createdAt = new Date().toISOString();
          }

          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            link: data.link,
            imageUrl: data.imageUrl,
            imageHint: data.imageHint || '',
            category: data.category,
            country: data.country,
            tags: data.tags || [],
            createdAt: createdAt,
          } as GroupLink;
        });
        
        console.log("Mapped groups data:", groupsData);
        setGroups(groupsData);

      } catch (error) {
        console.error("Error fetching groups from Firestore:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGroups();
  }, []);

  const handleGroupSubmitted = (newGroup: GroupLink) => {
    setGroups(prev => [newGroup, ...prev]);
    setIsSubmitDialogOpen(false);
  };

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
              
              {isLoading ? (
                <div className={`transition-all duration-500 ${
                  view === 'grid'
                    ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                    : 'flex flex-col gap-6'
                }`}>
                  {Array.from({ length: 8 }).map((_, i) => (
                     view === 'grid' ? (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                     ) : (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                     )
                  ))}
                </div>
              ) : (
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
              )}


              {!isLoading && filteredGroups.length === 0 && (
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
