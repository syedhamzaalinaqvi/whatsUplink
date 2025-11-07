
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SubmitGroupForm } from './submit-group-form';
import type { Category, Country } from '@/lib/data';

type SubmitGroupDialogProps = {
  categories: Category[];
  countries: Country[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function SubmitGroupDialog({ categories, countries, isOpen, onOpenChange }: SubmitGroupDialogProps) {
  
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-full sm:h-auto flex flex-col p-0 sm:max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-20">
          <DialogTitle>Submit a New Group</DialogTitle>
          <DialogDescription>
            Share a WhatsApp group or channel with the world. Fill out the form below to add it to our directory.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6">
          <SubmitGroupForm
            categories={categories}
            countries={countries}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
