'use client';
import { useRef, useState, useTransition, useEffect } from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, getGroupPreview, type FormState } from '@/app/actions';
import type { GroupLink, Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { updateGroup } from '@/app/admin/actions';

type PreviewData = {
    title?: string;
    description?: string;
    image?: string;
};

type SubmitGroupDialogContentProps = {
  onGroupSubmitted: (group: GroupLink) => void;
  groupToEdit?: GroupLink | null;
  categories: Category[];
  countries: Country[];
}

export function SubmitGroupDialogContent({ onGroupSubmitted, groupToEdit, categories, countries }: SubmitGroupDialogContentProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!groupToEdit;
  const [isPending, startTransition] = useTransition();
  const [isFetchingPreview, startFetchingPreview] = useTransition();

  const [link, setLink] = useState(groupToEdit?.link || '');
  const [type, setType] = useState<'group' | 'channel'>(groupToEdit?.type || 'group');
  const [preview, setPreview] = useState<PreviewData | null>(groupToEdit ? { image: groupToEdit.imageUrl, title: groupToEdit.title, description: groupToEdit.description } : null);

  const areFiltersReady = categories && categories.length > 0 && countries && countries.length > 0;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://whatsapp.com/channel/..."
  };
  
  useEffect(() => {
    if (groupToEdit) {
      setLink(groupToEdit.link);
      setType(groupToEdit.type);
      setPreview({
        title: groupToEdit.title,
        description: groupToEdit.description,
        image: groupToEdit.imageUrl,
      });
    } else {
        setLink('');
        setType('group');
        setPreview(null);
        if (formRef.current) formRef.current.reset();
    }
  }, [groupToEdit]);

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
    
    // Manually add the link from state
    rawData.link = link;

    const action = isEditMode ? updateGroup : submitGroup;

    startTransition(async () => {
      // The `updateGroup` action expects FormData, so we reconstruct it
      if (isEditMode) {
        const fullFormData = new FormData();
        Object.keys(rawData).forEach(key => {
            fullFormData.append(key, rawData[key] as string);
        });
         if(groupToEdit?.id) {
           fullFormData.append('id', groupToEdit.id);
        }
        
        const result = await updateGroup({ message: '', errors: {}}, fullFormData);
        if (result.group) {
            toast({ title: 'Success!', description: result.message });
            onGroupSubmitted(result.group);
        } else {
            const errorMsg = result.errors?.link?.[0] || result.message;
            toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        }
      } else {
        // submitGroup expects a plain object
        const result = await submitGroup(rawData);
        if (result.group) {
            toast({ title: 'Success!', description: result.message });
            onGroupSubmitted(result.group);
        } else {
            const errorMsg = result.errors?.link?.[0] || result.message;
            toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        }
      }
    });
  };

  const title = isEditMode ? 'Edit Group or Channel' : 'Submit a New Group or Channel';
  const description = isEditMode
    ? 'Update the details for this entry.'
    : 'Select a type, paste a WhatsApp link, and fill out the form.';

  return (
    <>
      <div className="p-6 pb-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <form ref={formRef} onSubmit={handleSubmit} id="submit-group-form" className="grid grid-cols-2 gap-x-4 gap-y-6">
            
            <div className="space-y-2 col-span-2">
              <Label>Type</Label>
              <RadioGroup name="type" value={type} onValueChange={(v: 'group' | 'channel') => setType(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="group" id="type-group" />
                      <Label htmlFor="type-group">Group</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="channel" id="type-channel" />
                      <Label htmlFor="type-channel">Channel</Label>
                  </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2 col-span-2">
                <Label htmlFor="link">Link</Label>
                <div className="flex items-center gap-2">
                    <Input id="link" name="link" type="url" placeholder={placeholders[type]} value={link} onChange={e => setLink(e.target.value)} />
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
              <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" defaultValue={preview?.title || groupToEdit?.title || ''} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." defaultValue={preview?.description || groupToEdit?.description || ''} />
            </div>
            
            <input type="hidden" name="imageUrl" value={preview?.image || groupToEdit?.imageUrl || 'https://picsum.photos/seed/placeholder/512/512'} />

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="country">Country</Label>
              <Select name="country" defaultValue={groupToEdit?.country}>
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
              <Select name="category" defaultValue={groupToEdit?.category}>
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
              <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" defaultValue={groupToEdit?.tags?.join(', ')} />
              <p className="text-xs text-muted-foreground">Separate tags with a comma. All tags will be converted to lowercase.</p>
            </div>
        </form>
      </div>

      <DialogFooter className="p-6 pt-4 border-t bg-background">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button form="submit-group-form" type="submit" disabled={isPending || !areFiltersReady}>
           {(isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {isEditMode ? 'Save Changes' : 'Submit Entry'}
        </Button>
      </DialogFooter>
    </>
  );
}
