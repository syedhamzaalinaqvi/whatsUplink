
'use client';
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, getGroupPreview, type FormState } from '@/app/actions';
import type { Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import Image from 'next/image';

type SubmitGroupPageContentProps = {
    categories: Category[];
    countries: Country[];
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Entry
        </Button>
    );
}

export function SubmitGroupPageContent({ categories, countries }: SubmitGroupPageContentProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<'group' | 'channel'>('group');
  
  const initialState: FormState = { message: '', errors: {} };
  const [state, formAction] = useFormState(submitGroup, initialState);
  
  useEffect(() => {
    if (state.message) {
      if (state.group) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        router.push(`/group/invite/${state.group.id}`);
      } else {
        const errorMsg = state.errors ? Object.values(state.errors).flat().join('\n') : state.message;
        toast({
          title: 'Error',
          description: errorMsg || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    }
  }, [state, router, toast]);

  const handleLinkChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setLink(newLink);

    const isFullLink = newLink.startsWith('https://chat.whatsapp.com/') || newLink.includes('whatsapp.com/channel');
    if (isFullLink) {
        setIsFetchingPreview(true);
        try {
            const preview = await getGroupPreview(newLink);
            if (preview && !preview.error) {
                setTitle(preview.title || '');
                setDescription(preview.description || '');
                setImageUrl(preview.image || '');
            } else {
                toast({
                    title: 'Preview Failed',
                    description: preview.error || 'Could not fetch group preview.',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsFetchingPreview(false);
        }
    }
  };

  const areFiltersReady = !!categories && !!countries;

  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://whatsapp.com/channel/..."
  };

  return (
    <form action={formAction} className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
        
        <input type="hidden" name="imageUrl" value={imageUrl} />

        <div className="space-y-2 col-span-2">
            <Label>Type</Label>
            <RadioGroup name="type" value={type} onValueChange={(v: 'group' | 'channel') => setType(v)} className="flex gap-4">
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
            <div className="relative">
                <Input id="link" name="link" type="url" placeholder={placeholders[type]} value={link} onChange={handleLinkChange} />
                {isFetchingPreview && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
            {state.errors?.link && <p className="text-sm font-medium text-destructive">{state.errors.link[0]}</p>}
            
            {imageUrl && (
                <div className="mt-4 flex items-center gap-4 p-4 border rounded-md bg-muted/50">
                    <Image
                        src={imageUrl}
                        alt="Fetched Preview"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain rounded-md"
                    />
                    <p className="text-xs text-muted-foreground">
                        Image preview fetched successfully. You can update the title and description if needed.
                    </p>
                </div>
            )}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" value={title} onChange={(e) => setTitle(e.target.value)} />
          {state.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." value={description} onChange={(e) => setDescription(e.target.value)} />
          {state.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="country">Country</Label>
          <Select name="country" value={country} onValueChange={setCountry}>
              <SelectTrigger id="country" disabled={!areFiltersReady}>
                  <SelectValue placeholder={!areFiltersReady ? 'Loading...' : 'Select a country'} />
              </SelectTrigger>
              <SelectContent>
                  {countries?.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          {state.errors?.country && <p className="text-sm font-medium text-destructive">{state.errors.country[0]}</p>}
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="category">Category</Label>
          <Select name="category" value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" disabled={!areFiltersReady}>
                  <SelectValue placeholder={!areFiltersReady ? 'Loading...' : 'Select a category'} />
              </SelectTrigger>
              <SelectContent>
                  {categories?.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          {state.errors?.category && <p className="text-sm font-medium text-destructive">{state.errors.category[0]}</p>}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" value={tags} onChange={(e) => setTags(e.target.value)} />
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
        </div>

        <div className="col-span-2 flex justify-end pt-4">
           <SubmitButton />
        </div>
    </form>
  );
}
