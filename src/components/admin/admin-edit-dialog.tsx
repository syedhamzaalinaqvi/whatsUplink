
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
}

export function AdminEditDialog({ group, isOpen, onOpenChange, categories, countries }: AdminEditDialogProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-full sm:h-auto overflow-y-auto">
                 <DialogHeader className='px-6 pt-6 sm:px-0 sm:pt-0'>
                    <DialogTitle>{group ? 'Edit Group' : 'Add New Group'}</DialogTitle>
                    <DialogDescription>
                        {group ? 'Update the details for this group.' : 'Add a new group to the directory.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 px-6 sm:px-0">
                    <SubmitGroupForm
                        categories={categories}
                        countries={countries}
                        groupToEdit={group}
                        onSuccess={() => onOpenChange(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
