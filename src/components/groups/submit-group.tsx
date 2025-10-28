
'use client';

import { useState } from 'react';
import type { GroupLink, Category, Country } from '@/lib/data';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCirclePlus } from 'lucide-react';
import { SubmitGroupDialogContent } from './submit-group-dialog';


export function SubmitGroup({ 
    onGroupSubmitted,
    categories,
    countries,
    isLoading,
}: { 
    onGroupSubmitted: (group: GroupLink) => void;
    categories: Category[];
    countries: Country[];
    isLoading?: boolean;
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const handleGroupSubmittedAndClose = (newGroup: GroupLink) => {
        onGroupSubmitted(newGroup);
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
