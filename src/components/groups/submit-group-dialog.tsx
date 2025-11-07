
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
      <DialogContent className="sm:max-w-4xl h-full sm:h-auto flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Submit a New Group</DialogTitle>
          <DialogDescription>
            Share a WhatsApp group or channel with the world. Fill out the form below to add it to our directory.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6">
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
