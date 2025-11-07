'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category, Country, NavLink } from '@/lib/data';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SubmitGroupDialog } from '../groups/submit-group-dialog';

type HeaderProps = {
  navLinks?: NavLink[];
  logoUrl?: string;
  categories: Category[];
  countries: Country[];
};

export function Header({ 
    navLinks = [],
    logoUrl,
    categories,
    countries,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // This state is now the single source of truth, controlled by the URL.
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  
  const finalLogoUrl = logoUrl || '/whatsuplink_logo_and_favicon_without_background.png';

  // Effect to sync dialog state with URL
  useEffect(() => {
    setIsSubmitDialogOpen(searchParams.get('submit-form') === 'true');
  }, [searchParams]);

  // Function to open the dialog by updating the URL
  const openSubmitDialog = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('submit-form', 'true');
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Function to close the dialog by updating the URL
  const handleDialogChange = useCallback((open: boolean) => {
    if (!open) {
        // Use router.replace to remove the query from the URL without adding to history
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('submit-form');
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);


  const createSubmitButton = (isMobile = false) => {
    const handleClick = () => {
      openSubmitDialog();
      if (isMobile) {
        setIsMobileMenuOpen(false);
      }
    };
    return <Button onClick={handleClick}>Submit Group</Button>;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
             <Image
              src={finalLogoUrl}
              alt="WhatsUpLink Logo"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              unoptimized
            />
            <h1 className="text-2xl font-bold tracking-tighter text-foreground">
              WhatsUp<span className="text-primary">Link</span>
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.filter(link => link.href !== '/submit').map((link) => (
              <Link key={link.id} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
             {createSubmitButton(false)}
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
                        <Image
                          src={finalLogoUrl}
                          alt="WhatsUpLink Logo"
                          width={36}
                          height={36}
                          className="h-9 w-9"
                          unoptimized
                        />
                        <h1 className="text-2xl font-bold tracking-tighter text-foreground">
                            WhatsUp<span className="text-primary">Link</span>
                        </h1>
                    </Link>
                    <nav className="flex flex-col gap-4">
                    {navLinks.filter(link => link.href !== '/submit').map((link) => (
                      <Link key={link.id} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  {createSubmitButton(true)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* The dialog is rendered here, controlled by URL state */}
      <SubmitGroupDialog
        categories={categories}
        countries={countries}
        isOpen={isSubmitDialogOpen}
        onOpenChange={handleDialogChange}
      />
    </>
  );
}
