'use client';
import { useRef, useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
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

function SubmitButton({ areFiltersReady }: { areFiltersReady: boolean; }) {
    const { pending } = useFormStatus();

    const getButtonContent = () => {
        if (pending) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            );
        }
        if (!areFiltersReady) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Filters...
                </>
            );
        }
        return 'Submit Entry';
    }

    return (
        <Button type="submit" disabled={pending || !areFiltersReady} className="w-full sm:w-auto">
            {getButtonContent()}
        </Button>
    );
}

export function SubmitGroupPageContent({ categories, countries }: SubmitGroupPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const areFiltersReady = !!categories && !!countries;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://www.whatsapp.com/channel/..."
  };

  const initialState: FormState = { message: '', errors: {} };
  const [state, formAction] = useActionState(submitGroup, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.group) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        router.push(`/group/invite/${state.group.id}`);
      } else {
        const errorMsg = 
            state.errors?.link?.[0] || 
            state.errors?.title?.[0] || 
            state.errors?.description?.[0] || 
            state.errors?.category?.[0] || 
            state.errors?.country?.[0] || 
            state.message;
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
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
            <div className="flex items-center gap-2">
                <Input id="link" name="link" type="url" placeholder="https://chat.whatsapp.com/..." />
            </div>
          {state.errors?.link && <p className="text-sm font-medium text-destructive">{state.errors.link[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" />
           {state.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." />
           {state.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
        </div>
        
        <input type="hidden" name="imageUrl" defaultValue="https://picsum.photos/seed/placeholder/512/512" />
        
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
           {state.errors?.country && <p className="text-sm font-medium text-destructive">{state.errors.country[0]}</p>}
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
           {state.errors?.category && <p className="text-sm font-medium text-destructive">{state.errors.category[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" />
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
        </div>

        <div className="col-span-2 flex justify-end pt-4">
            <SubmitButton areFiltersReady={areFiltersReady} />
        </div>
    </form>
  );
}
