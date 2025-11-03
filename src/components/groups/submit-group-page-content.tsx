
'use client';
import { useRef, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, getGroupPreview, type FormState } from '@/app/actions';
import type { Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type PreviewData = {
    title?: string;
    description?: string;
    image?: string;
};

type SubmitGroupPageContentProps = {
    categories: Category[];
    countries: Country[];
}

function SubmitButton({ isFetchingPreview, areFiltersReady }: { isFetchingPreview: boolean; areFiltersReady: boolean; }) {
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
        if (isFetchingPreview) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
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
        <Button form="submit-group-form" type="submit" disabled={pending || isFetchingPreview || !areFiltersReady} className="w-full sm:w-auto">
            {getButtonContent()}
        </Button>
    );
}

export function SubmitGroupPageContent({ categories, countries }: SubmitGroupPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  
  const [type, setType] = useState<'group' | 'channel'>('group');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();

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
        // Redirect to detail page after successful submission
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

  const handleFetchPreview = () => {
    const link = linkInputRef.current?.value || '';
    
    const isGroupLink = link.startsWith('https://chat.whatsapp.com/');
    const isChannelLink = link.includes('whatsapp.com/channel');

    const isValidForType = (type === 'group' && isGroupLink) || (type === 'channel' && isChannelLink);

    if (isValidForType) {
        startFetchingPreview(async () => {
            const result = await getGroupPreview(link);
            if (result && !result.error) {
                setPreview(result);
                // Manually update form fields that the formAction will use
                if (formRef.current) {
                    (formRef.current.elements.namedItem('title') as HTMLInputElement).value = result.title || '';
                    (formRef.current.elements.namedItem('description') as HTMLTextAreaElement).value = result.description || '';
                    (formRef.current.elements.namedItem('imageUrl') as HTMLInputElement).value = result.image || '';
                }
            } else {
                setPreview(null);
                if (result.error) {
                    toast({
                        title: 'Preview Error',
                        description: result.error,
                        variant: 'destructive'
                    });
                }
            }
        });
    } else {
         toast({
            title: 'Invalid Link',
            description: `Please enter a valid WhatsApp ${type} link.`,
            variant: 'destructive'
        });
        setPreview(null);
    }
  };

  return (
    <form ref={formRef} action={formAction} id="submit-group-form" className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
        
        <div className="space-y-2 col-span-2">
            <Label>Type</Label>
            <RadioGroup name="type" defaultValue={type} onValueChange={(v: 'group' | 'channel') => {
                setType(v);
                setPreview(null);
                if(linkInputRef.current) linkInputRef.current.value = '';
            }} className="flex gap-4">
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
              <Input id="link" name="link" type="url" placeholder={placeholders[type]} ref={linkInputRef} />
              <Button type="button" variant="secondary" onClick={handleFetchPreview} disabled={isFetchingPreview}>
                  {isFetchingPreview ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Fetch'}
              </Button>
            </div>
          {state.errors?.link && <p className="text-sm font-medium text-destructive">{state.errors.link[0]}</p>}
        </div>

        {(isFetchingPreview || preview) && (
            <div className="col-span-2 p-4 border rounded-lg bg-muted/50 flex flex-col items-center gap-4">
                {isFetchingPreview ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Fetching preview...</span>
                    </div>
                ) : preview?.image ? (
                    <Image src={preview.image} alt="Group Preview" width={100} height={100} className="rounded-lg object-cover" />
                ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <LinkIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
            </div>
        )}
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" defaultValue={preview?.title || ''} />
           {state.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." defaultValue={preview?.description || ''} />
           {state.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
        </div>
        
        <input type="hidden" name="imageUrl" defaultValue={preview?.image || ''} />
        
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
            <SubmitButton isFetchingPreview={isFetchingPreview} areFiltersReady={areFiltersReady} />
        </div>
    </form>
  );
}
