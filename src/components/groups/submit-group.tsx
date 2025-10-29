
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCirclePlus } from 'lucide-react';
import { SubmitGroupDialogContent } from './submit-group-dialog';
import { Dialog, DialogTrigger } from '../ui/dialog';
import type { Category, Country, GroupLink } from '@/lib/data';

export function SubmitGroup({ 
    onGroupSubmitted,
    isLoading,
    categories,
    countries
}: { 
    onGroupSubmitted: (group: GroupLink) => void;
    isLoading?: boolean;
    categories: Category[];
    countries: Country[];
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleGroupSubmittedAndClose = (group: GroupLink) => {
        onGroupSubmitted(group);
        setIsDialogOpen(false);
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                 <Button disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <MessageCirclePlus className="mr-2 h-4 w-4" />
                    )}
                    Submit Group
                </Button>
            </DialogTrigger>
            <SubmitGroupDialogContent 
                onGroupSubmitted={handleGroupSubmittedAndClose}
                categories={categories}
                countries={countries}
            />
        </Dialog>
    );
}
