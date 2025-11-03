
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCirclePlus } from 'lucide-react';
import { SubmitGroupDialogContent } from './submit-group-dialog';
import { Dialog, DialogContent } from '../ui/dialog';
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDialogOpen = searchParams.get('submit-form') === 'true';

    const handleOpenChange = (open: boolean) => {
        const params = new URLSearchParams(searchParams.toString());
        if (open) {
            params.set('submit-form', 'true');
        } else {
            params.delete('submit-form');
        }
        router.push(`?${params.toString()}`);
    };
    
    const handleGroupSubmittedAndClose = (group: GroupLink) => {
        onGroupSubmitted(group);
        handleOpenChange(false);
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <Button onClick={() => handleOpenChange(true)} disabled={isLoading}>
                 {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <MessageCirclePlus className="mr-2 h-4 w-4" />
                )}
                Submit Group
            </Button>
            <DialogContent className="flex flex-col h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl p-0">
                <SubmitGroupDialogContent 
                    onGroupSubmitted={handleGroupSubmittedAndClose}
                    categories={categories}
                    countries={countries}
                />
            </DialogContent>
        </Dialog>
    );
}
