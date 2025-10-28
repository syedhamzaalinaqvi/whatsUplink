
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { Category, Country, GroupLink } from '@/lib/data';
import { SubmitGroupDialogContent } from '../groups/submit-group-dialog';


type AdminEditDialogProps = {
    group: GroupLink | null; // Null for new, object for editing
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    categories: Category[];
    countries: Country[];
}

export function AdminEditDialog({ group, isOpen, onOpenChange, categories, countries }: AdminEditDialogProps) {
    const handleGroupSubmittedAndClose = () => {
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <SubmitGroupDialogContent 
                onGroupSubmitted={handleGroupSubmittedAndClose}
                groupToEdit={group}
                categories={categories}
                countries={countries}
            />
        </Dialog>
    );
}
