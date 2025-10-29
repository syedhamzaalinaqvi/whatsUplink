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
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, getGroupPreview } from '@/app/actions';
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
  
  const [link, setLink] = useState(groupToEdit?.link || '');
  const [preview, setPreview] = useState<PreviewData | null>(groupToEdit ? { image: groupToEdit.imageUrl } : null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const areFiltersReady = categories && categories.length > 0 && countries && countries.length > 0;

  useEffect(() => {
    if (groupToEdit) {
      setLink(groupToEdit.link);
      setPreview({
        title: groupToEdit.title,
        description: groupToEdit.description,
        image: groupToEdit.imageUrl,
      });
    } else {
        setLink('');
        setPreview(null);
        formRef.current?.reset();
    }
  }, [groupToEdit]);


  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setLink(newLink);
    if (newLink.startsWith('https://chat.whatsapp.com/')) {
        startFetchingPreview(async () => {
            const result = await getGroupPreview(newLink);
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

  const handleFormSubmit = async (formData: FormData) => {
    startSubmitting(async () => {
      const action = isEditMode ? updateGroup : submitGroup;
      const result = await action({ message: '' }, formData);

      if (result.group) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onGroupSubmitted(result.group);
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const title = isEditMode ? 'Edit Group or Channel' : 'Submit a New Group or Channel';
  const description = isEditMode
    ? 'Update the details for this entry.'
    : 'Paste a WhatsApp group or channel link to fetch its details automatically, then fill out the rest of the form.';

  return (
    <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form ref={formRef} action={handleFormSubmit} id="submit-group-form" className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
        {isEditMode && <input type="hidden" name="id" value={groupToEdit.id} />}
        <div className="space-y-2 col-span-2">
          <Label htmlFor="link">Group or Channel Link</Label>          
          <Input id="link" name="link" type="url" placeholder="https://chat.whatsapp.com/..." required value={link} onChange={handleLinkChange} />
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
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" required defaultValue={preview?.title || groupToEdit?.title} key={preview?.title || groupToEdit?.title} readOnly={!isEditMode && !!preview?.title}/>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." required defaultValue={preview?.description || groupToEdit?.description} key={preview?.description || groupToEdit?.description} />
        </div>
        
        <input type="hidden" name="imageUrl" value={preview?.image || groupToEdit?.imageUrl || ''} />
        
        <div className="space-y-2 col-span-2">
          <Label>Type</Label>
          <RadioGroup name="type" required defaultValue={groupToEdit?.type || 'group'} className="flex gap-4">
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


        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="country">Country</Label>
          <Select name="country" required defaultValue={groupToEdit?.country}>
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
          <Select name="category" required defaultValue={groupToEdit?.category}>
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
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
        </div>
      </form>
      <DialogFooter>
        <Button type="submit" form="submit-group-form" disabled={isSubmitting || isFetchingPreview || !areFiltersReady}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Saving...' : 'Processing...'}
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
            isEditMode ? 'Save Changes' : 'Submit Entry'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
