
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToNewsletter } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);

    const result = await subscribeToNewsletter(formData);

    if (result.message) {
      toast({
        title: result.success ? 'Success!' : 'Oops!',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    }

    if (!result.success) {
      setError(result.message);
    } else {
      setEmail(''); // Clear input on success
    }

    setIsPending(false);
  };

  return (
    <div className="space-y-4 w-full max-w-sm text-center">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Stay Updated</h3>
        <p className="text-sm text-muted-foreground">
          Subscribe to our newsletter to get the latest group links and updates delivered to your inbox.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full gap-4">
        <div className="relative w-full">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="pl-9 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
