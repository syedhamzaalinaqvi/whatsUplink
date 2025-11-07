
'use client';

import { useState, useEffect } from 'react';
import type { GroupLink, Category, Country, NavLink } from '@/lib/data';
import { Menu, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type HeaderProps = {
  navLinks?: NavLink[];
  logoUrl?: string;
  isLoadingFilters?: boolean;
};

export function Header({ 
    navLinks = [],
    logoUrl,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const finalLogoUrl = logoUrl || '/whatsuplink_logo_and_favicon_without_background.png';

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
            {navLinks.map((link) => (
              <Link key={link.id} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
             <Button asChild>
                <Link href="/submit">Submit Group</Link>
             </Button>
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
                    {navLinks.map((link) => (
                      <Link key={link.id} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  <Button asChild onClick={() => setIsMobileMenuOpen(false)}>
                    <Link href="/submit">Submit Group</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
