
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Category, Country, GroupLink } from '@/lib/data';

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
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>Edit Group</DialogTitle>
                    <DialogDescription>
                        The group editing form has been temporarily removed.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">The form for editing and adding groups is currently under construction to resolve some issues. Please use the "Delete" function for now if you need to remove a group.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
