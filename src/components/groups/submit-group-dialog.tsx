
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SubmitGroupForm } from './submit-group-form';
import type { Category, Country } from '@/lib/data';
import type { ReactNode } from 'react';

type SubmitGroupDialogProps = {
  categories: Category[];
  countries: Country[];
  children: ReactNode; // The trigger button
};

export function SubmitGroupDialog({ categories, countries, children }: SubmitGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-full sm:h-auto overflow-y-auto">
        <DialogHeader className="px-6 pt-6 sm:px-0 sm:pt-0">
          <DialogTitle>Submit a New Group</DialogTitle>
          <DialogDescription>
            Share a WhatsApp group or channel with the world. Fill out the form below to add it to our directory.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 px-6 sm:px-0">
          <SubmitGroupForm
            categories={categories}
            countries={countries}
            onSuccess={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
