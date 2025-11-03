'use client';
import { useRef, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, type FormState, getGroupPreview } from '@/app/actions';
import type { Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type SubmitGroupPageContentProps = {
    categories: Category[];
    countries: Country[];
}

type PreviewData = {
    title?: string;
    description?: string;
    image?: string;
};

export function SubmitGroupPageContent({ categories, countries }: SubmitGroupPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isFetchingPreview, startFetchingPreview] = useTransition();

  const [link, setLink] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const areFiltersReady = !!categories && !!countries;

  const handleFetchPreview = () => {
    if (!link) {
      toast({
        title: 'Error',
        description: 'Please enter a link to fetch its preview.',
        variant: 'destructive',
      });
      return;
    }

    startFetchingPreview(async () => {
      const result = await getGroupPreview(link);
      if (result.error) {
        toast({
          title: 'Preview Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        setPreview(result);
        if (formRef.current) {
          (formRef.current.elements.namedItem('title') as HTMLInputElement).value = result.title || '';
          (formRef.current.elements.namedItem('description') as HTMLTextAreaElement).value = result.description || '';
        }
        toast({
          title: 'Success',
          description: 'Preview fetched successfully!',
        });
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawData = Object.fromEntries(formData.entries());
    rawData.link = link; // Manually add link from state

    startTransition(async () => {
        const result = await submitGroup(rawData);
        if (result.group) {
            toast({
              title: 'Success!',
              description: result.message,
            });
            router.push(`/group/invite/${result.group.id}`);
        } else {
            const errorMsg = result.errors?.link?.[0] || result.message;
            toast({
              title: 'Error',
              description: errorMsg,
              variant: 'destructive',
            });
        }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} id="submit-group-page-form" className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
        
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
                <Input id="link" name="link" type="url" placeholder="https://chat.whatsapp.com/..." value={link} onChange={e => setLink(e.target.value)} />
                <Button type="button" variant="outline" size="sm" onClick={handleFetchPreview} disabled={isFetchingPreview}>
                    {isFetchingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Fetch Preview</span>
                </Button>
            </div>
        </div>

        {preview?.image && (
            <div className="col-span-2 p-4 border rounded-lg bg-muted/50 flex flex-col items-center gap-4">
                <Image src={preview.image} alt="Group Preview" width={100} height={100} className="rounded-lg object-cover" />
            </div>
        )}
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" defaultValue={preview?.title || ''} />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." defaultValue={preview?.description || ''} />
        </div>
        
        <input type="hidden" name="imageUrl" value={preview?.image || 'https://picsum.photos/seed/placeholder/512/512'} />
        
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
            <Button type="submit" disabled={isPending || !areFiltersReady} className="w-full sm:w-auto">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Entry'}
            </Button>
        </div>
    </form>
  );
}
