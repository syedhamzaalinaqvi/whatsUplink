
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink, Category, Country, NavLink } from '@/lib/data';
import { Menu, MessagesSquare, Loader2 } from 'lucide-react';
import { SubmitGroup } from '@/components/groups/submit-group';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getCategories, getCountries } from '@/app/admin/actions';

type HeaderProps = {
  onGroupSubmitted?: (group: GroupLink) => void;
  navLinks?: NavLink[];
  categories?: Category[];
  countries?: Country[];
  isLoadingFilters?: boolean;
};

export function Header({ 
    onGroupSubmitted = () => {}, 
    navLinks = [],
    categories: initialCategories, 
    countries: initialCountries,
    isLoadingFilters: initialIsLoading
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [countries, setCountries] = useState<Country[]>(initialCountries || []);
  const [isLoading, setIsLoading] = useState(initialIsLoading ?? (!initialCategories || !initialCountries));

  useEffect(() => {
    // If props are not provided, fetch them. This makes the header self-sufficient on static pages.
    if (!initialCategories || !initialCountries) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [cats, counts] = await Promise.all([getCategories(), getCountries()]);
          setCategories(cats);
          setCountries(counts);
        } catch (error) {
            console.error("Failed to fetch header data:", error);
        } finally {
            setIsLoading(false);
        }
      }
      fetchData();
    } else {
        setCategories(initialCategories);
        setCountries(initialCountries);
        setIsLoading(initialIsLoading ?? false);
    }
  }, [initialCategories, initialCountries, initialIsLoading]);


  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MessagesSquare className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">
              WhatsUp<span className="text-primary">Link</span>
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.id} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <SubmitGroup onGroupSubmitted={onGroupSubmitted} categories={categories} countries={countries} isLoading={isLoading} />
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="p-6">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-6 pt-0">
                    <Link href="/" className="flex items-center gap-2 mb-4" onClick={() => setIsMobileMenuOpen(false)}>
                        <MessagesSquare className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tighter text-foreground">
                            WhatsUp<span className="text-primary">Link</span>
                        </h1>
                    </Link>
                    <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link key={link.id} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Floating Submit Button */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <SubmitGroup onGroupSubmitted={onGroupSubmitted} categories={categories} countries={countries} isLoading={isLoading} />
      </div>
    </>
  );
}
