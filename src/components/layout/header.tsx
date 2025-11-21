
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category, Country, NavLink } from '@/lib/data';
import { Menu, Globe, Folder } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SubmitGroupDialog } from '../groups/submit-group-dialog';
import { Dialog } from '../ui/dialog';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


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
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  
  const finalLogoUrl = logoUrl || '/whatsuplink_logo_and_favicon_without_background.png';

  // Effect to sync dialog state with URL on initial load and back/forward navigation
  useEffect(() => {
    setIsSubmitDialogOpen(searchParams.get('submit-form') === 'true');
  }, [searchParams]);

  // This function is called when the dialog's open state is changed by any means
  // (e.g., clicking X, pressing Esc, clicking overlay)
  const handleDialogChange = useCallback((open: boolean) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (open) {
      newParams.set('submit-form', 'true');
      // Use push to add to history, allowing back button to close dialog
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    } else {
      newParams.delete('submit-form');
      // Use replace to not add to history when closing
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
    // This will trigger the useEffect above to update the state
  }, [pathname, router, searchParams]);

  // This function is what buttons call to signal their intent to open the dialog
  const openSubmitDialog = () => {
    handleDialogChange(true);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
  >(({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  })
  ListItem.displayName = "ListItem"

  const renderMobileNavContent = () => (
    <div className="flex flex-col gap-2 p-6 pt-0">
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
        <nav className="flex flex-col gap-1 text-lg font-medium">
             {navLinks.filter(link => link.href === '/').map(link => (
                 <Link key={link.id} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-foreground transition-colors hover:text-primary">
                    {link.label}
                 </Link>
             ))}
            
            <Accordion type="multiple" className="w-full">
                <AccordionItem value="categories">
                    <AccordionTrigger className="py-2 text-lg font-medium text-foreground transition-colors hover:text-primary hover:no-underline">
                        <div className="flex items-center gap-2">
                           <Folder className='h-5 w-5'/> Categories
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ScrollArea className="h-64">
                             <div className="flex flex-col gap-1 pl-4 pt-2">
                                {categories.map(category => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.value}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 text-base font-normal text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {category.label}
                                    </Link>
                                ))}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="countries">
                    <AccordionTrigger className="py-2 text-lg font-medium text-foreground transition-colors hover:text-primary hover:no-underline">
                        <div className="flex items-center gap-2">
                            <Globe className='h-5 w-5'/> Countries
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                         <ScrollArea className="h-64">
                             <div className="flex flex-col gap-1 pl-4 pt-2">
                                {countries.map(country => (
                                    <Link
                                        key={country.id}
                                        href={`/country/${country.value}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="py-2 text-base font-normal text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {country.label}
                                    </Link>
                                ))}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            {navLinks.filter(link => !['/', '/submit'].includes(link.href)).map((link) => (
              <Link key={link.id} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-lg font-medium text-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
      </nav>
    </div>
  );

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
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
                {navLinks.filter(link => link.href === '/').map(link => (
                    <NavigationMenuItem key={link.id}>
                        <Link href={link.href} legacyBehavior passHref>
                          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                            {link.label}
                          </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                ))}

                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                        <Folder className='mr-2 h-4 w-4'/> Categories
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ScrollArea className="h-96 w-64">
                            <ul className="p-4">
                                {categories.map((category) => (
                                  <Link href={`/category/${category.value}`} key={category.id} passHref legacyBehavior>
                                    <ListItem
                                        title={category.label}
                                    />
                                  </Link>
                                ))}
                            </ul>
                        </ScrollArea>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                         <Globe className='mr-2 h-4 w-4'/> Countries
                    </NavigationMenuTrigger>
                     <NavigationMenuContent>
                        <ScrollArea className="h-96 w-64">
                            <ul className="p-4">
                                {countries.map((country) => (
                                  <Link href={`/country/${country.value}`} key={country.id} passHref legacyBehavior>
                                    <ListItem
                                        title={country.label}
                                    />
                                  </Link>
                                ))}
                            </ul>
                        </ScrollArea>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                 {navLinks.filter(link => !['/', '/submit'].includes(link.href)).map(link => (
                    <NavigationMenuItem key={link.id}>
                         <Link href={link.href} passHref legacyBehavior>
                           <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                             {link.label}
                           </NavigationMenuLink>
                         </Link>
                    </NavigationMenuItem>
                ))}

            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="hidden md:flex items-center gap-4">
            {/* The "Submit Group" button is now in the hero section for desktop */}
          </div>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="p-6 pb-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                {renderMobileNavContent()}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* The Dialog component now directly controls the open state and URL changes */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={handleDialogChange}>
        <SubmitGroupDialog
          categories={categories}
          countries={countries}
        />
      </Dialog>
    </>
  );
}
