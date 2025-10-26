import { MessageCirclePlus, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tighter text-foreground">
            WhatsUp<span className="text-primary">Link</span>
          </h1>
        </div>
        <DialogTrigger asChild>
          <Button>
            <MessageCirclePlus className="mr-2 h-4 w-4" />
            Submit Group
          </Button>
        </DialogTrigger>
      </div>
    </header>
  );
}
