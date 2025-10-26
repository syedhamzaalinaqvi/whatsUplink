
import type { GroupLink } from '@/lib/data';
import { MessagesSquare } from 'lucide-react';
import { SubmitGroup } from '@/components/groups/submit-group';

export function Header({ onGroupSubmitted }: { onGroupSubmitted: (group: GroupLink) => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">
            WhatsUp<span className="text-primary">Link</span>
          </h1>
        </div>
        <SubmitGroup onGroupSubmitted={onGroupSubmitted} />
      </div>
    </header>
  );
}
