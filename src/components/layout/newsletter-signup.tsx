
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToNewsletter } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setIsPending(true);

    const formData = new FormData();
    formData.append('email', email);

    const result = await subscribeToNewsletter(formData);

    toast({
      title: result.success ? 'Success!' : 'Oops!',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      setEmail('');
    }

    setIsPending(false);
  };

  return (
    <Card className="w-full max-w-lg shadow-lg border-primary/20">
        <CardHeader className='text-center'>
            <CardTitle className='text-2xl tracking-tight'>Join the Community</CardTitle>
            <CardDescription>Get the latest group links and updates delivered straight to your inbox.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                <Input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    className="flex-1 text-base py-6"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    aria-label="Email for newsletter"
                />
                <Button type="submit" disabled={isPending} size="lg" className='py-6'>
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                    <span className="sr-only">Subscribe</span>
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}
