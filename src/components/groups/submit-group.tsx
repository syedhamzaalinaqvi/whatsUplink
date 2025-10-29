
'use client';

import { Button } from '@/components/ui/button';
import { Loader2, MessageCirclePlus } from 'lucide-react';
import Link from 'next/link';

export function SubmitGroup({ 
    isLoading,
}: { 
    isLoading?: boolean;
}) {

    return (
        <Button asChild disabled={isLoading}>
            <Link href="/submit">
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <MessageCirclePlus className="mr-2 h-4 w-4" />
                )}
                Submit Group
            </Link>
        </Button>
    );
}
