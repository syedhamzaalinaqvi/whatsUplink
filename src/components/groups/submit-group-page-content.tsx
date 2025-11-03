
'use client';
import { useRef, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, getGroupPreview } from '@/app/actions';
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

export function SubmitGroupPageContent({ categories, countries }: SubmitGroupPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [type, setType] = useState<'group' | 'channel'>('group');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const areFiltersReady = !!categories && !!countries;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://www.whatsapp.com/channel/..."
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value;
    
    const isGroupLink = link.startsWith('https://chat.whatsapp.com/');
    const isChannelLink = link.includes('whatsapp.com/channel');

    const isValidForType = (type === 'group' && isGroupLink) || (type === 'channel' && isChannelLink);

    if (isValidForType) {
        startFetchingPreview(async () => {
            const result = await getGroupPreview(link);
            if (result && !result.error) {
                setPreview(result);
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
        setPreview(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startSubmitting(async () => {
      const result = await submitGroup({ message: '' }, formData);

      if (result.group) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        // Redirect to homepage after successful submission
        router.push('/');
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.errors?.link?.[0] || result.errors?.title?.[0] || result.errors?.description?.[0] || result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} id="submit-group-form" className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
        
        <div className="space-y-2 col-span-2">
            <Label>Type</Label>
            <RadioGroup name="type" value={type} onValueChange={(v: 'group' | 'channel') => {
                setType(v);
                setPreview(null);
                if (formRef.current) {
                    const linkInput = formRef.current.elements.namedItem('link') as HTMLInputElement;
                    if(linkInput) linkInput.value = '';
                }
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
          <Input id="link" name="link" type="url" placeholder={placeholders[type]} onChange={handleLinkChange} />
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
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" defaultValue={preview?.title || ''} key={`title-${preview?.title}`} />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." defaultValue={preview?.description || ''} key={`desc-${preview?.description}`} />
        </div>
        
        <input type="hidden" name="imageUrl" value={preview?.image || ''} />
        
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
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" />
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
        </div>

        <div className="col-span-2 flex justify-end pt-4">
            <Button type="submit" form="submit-group-form" disabled={isSubmitting || isFetchingPreview || !areFiltersReady} className="w-full sm:w-auto">
            {isSubmitting ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
                </>
            ) : isFetchingPreview ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
                </>
            ) : !areFiltersReady ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Filters...
                </>
            )
            : (
                'Submit Entry'
            )}
            </Button>
        </div>
    </form>
  );
}
