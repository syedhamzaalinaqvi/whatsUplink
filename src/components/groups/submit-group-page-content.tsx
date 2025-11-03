'use client';
import { useRef, useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, type FormState } from '@/app/actions';
import type { Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type SubmitGroupPageContentProps = {
    categories: Category[];
    countries: Country[];
}

function SubmitButton() {
    const [isPending, setIsPending] = useState(false);
    // This is a workaround to get form status since useFormStatus is not reliable in all cases.
    useEffect(() => {
        const form = document.getElementById('submit-group-page-form');
        if (!form) return;

        const handleStart = () => setIsPending(true);
        const handleEnd = () => setIsPending(false);

        form.addEventListener('submit', handleStart);
        // We need a way to know when submission ends. We'll use a custom event.
        form.addEventListener('submit-complete', handleEnd);

        return () => {
            form.removeEventListener('submit', handleStart);
            form.removeEventListener('submit-complete', handleEnd);
        };
    }, []);

    return (
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Entry'}
        </Button>
    );
}

export function SubmitGroupPageContent({ categories, countries }: SubmitGroupPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const areFiltersReady = !!categories && !!countries;

  const initialState: FormState = { message: '', errors: {} };
  const [state, formAction] = useActionState(submitGroup, initialState);

  useEffect(() => {
    // Dispatch event to stop pending state on button
    if (formRef.current) {
        formRef.current.dispatchEvent(new Event('submit-complete'));
    }

    if (state.message && !state.group) {
        toast({
            title: 'Error',
            description: state.message,
            variant: 'destructive',
        });
    }
    if (state.group) {
        toast({
            title: 'Success!',
            description: state.message,
        });
        router.push(`/group/invite/${state.group.id}`);
    }
  }, [state, router, toast]);

  return (
    <form ref={formRef} action={formAction} id="submit-group-page-form" className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
        
        <div className="space-y-2 col-span-2">
            <Label>Type</Label>
            <RadioGroup name="type" defaultValue="group" className="flex gap-4">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="group" id="type-group-page" />
                    <Label htmlFor="type-group-page">Group</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="channel" id="type-channel-page" />
                    <Label htmlFor="type-channel-page">Channel</Label>
                </div>
            </RadioGroup>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="link">Link</Label>
            <Input id="link" name="link" type="url" placeholder="https://chat.whatsapp.com/..." />
            {state?.errors?.link && <p className="text-sm font-medium text-destructive">{state.errors.link[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" />
          {state?.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." />
          {state?.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
        </div>
        
         <div className="space-y-2 col-span-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://example.com/image.png"/>
              <p className="text-xs text-muted-foreground">If left blank, a default image will be used.</p>
              {state?.errors?.imageUrl && <p className="text-sm font-medium text-destructive">{state.errors.imageUrl[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="country">Country</Label>
          <Select name="country">
              <SelectTrigger id="country" disabled={!areFiltersReady}>
                  <SelectValue placeholder={!areFiltersReady ? 'Loading...' : 'Select a country'} />
              </SelectTrigger>
              <SelectContent>
                  {countries?.map(country => (
                      <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
           {state?.errors?.country && <p className="text-sm font-medium text-destructive">{state.errors.country[0]}</p>}
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="category">Category</Label>
          <Select name="category">
              <SelectTrigger id="category" disabled={!areFiltersReady}>
                  <SelectValue placeholder={!areFiltersReady ? 'Loading...' : 'Select a category'} />
              </SelectTrigger>
              <SelectContent>
                  {categories?.map(category => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
           {state?.errors?.category && <p className="text-sm font-medium text-destructive">{state.errors.category[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" />
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
            {state?.errors?.tags && <p className="text-sm font-medium text-destructive">{state.errors.tags[0]}</p>}
        </div>

        <div className="col-span-2 flex justify-end pt-4">
           <SubmitButton />
        </div>
    </form>
  );
}
