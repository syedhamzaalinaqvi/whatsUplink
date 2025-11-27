
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Category, Country, GroupLink } from '@/lib/data';
import { SubmitGroupForm } from '../groups/submit-group-form';

type AdminEditDialogProps = {
    group: GroupLink | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    categories: Category[];
    countries: Country[];
    onSuccess: () => void;
}

export function AdminEditDialog({ group, isOpen, onOpenChange, categories, countries, onSuccess }: AdminEditDialogProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-full sm:h-auto flex flex-col p-0 sm:max-h-[90vh]">
                 <DialogHeader className='p-6 pb-4 border-b sticky top-0 bg-background z-10'>
                    <DialogTitle>{group ? 'Edit Group' : 'Add New Group'}</DialogTitle>
                    <DialogDescription>
                        {group ? 'Update the details for this group.' : 'Add a new group to the directory.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto px-6 pb-6">
                    <SubmitGroupForm
                        categories={categories}
                        countries={countries}
                        groupToEdit={group}
                        onSuccess={() => {
                            onSuccess();
                            onOpenChange(false);
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

    