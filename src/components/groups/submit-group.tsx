
'use client';

import { useState } from 'react';
import type { GroupLink } from '@/lib/data';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCirclePlus } from 'lucide-react';
import { SubmitGroupDialogContent } from './submit-group-dialog';


export function SubmitGroup({ onGroupSubmitted }: { onGroupSubmitted: (group: GroupLink) => void; }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const handleGroupSubmitted = (newGroup: GroupLink) => {
        onGroupSubmitted(newGroup);
        setIsDialogOpen(false);
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <MessageCirclePlus className="mr-2 h-4 w-4" />
                    Submit Group
                </Button>
            </DialogTrigger>
            <SubmitGroupDialogContent onGroupSubmitted={handleGroupSubmitted} />
        </Dialog>
    );
}
