
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { subscribeToNewsletter } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { Label } from '../ui/label';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Subscribing...
        </>
      ) : (
        'Subscribe'
      )}
    </Button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useActionState(subscribeToNewsletter, {
    success: false,
    message: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Success!' : 'Oops!',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <div className="space-y-4 w-full max-w-sm text-center">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Stay Updated</h3>
        <p className="text-sm text-muted-foreground">
          Subscribe to our newsletter to get the latest group links and updates delivered to your inbox.
        </p>
      </div>
      <form action={formAction} className="flex flex-col items-center w-full gap-4">
        <div className="relative w-full">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="pl-9 w-full"
            />
        </div>
        <SubmitButton />
      </form>
      {!state.success && state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </div>
  );
}
