
'use client';
import { useRef, useState, useTransition, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { submitGroup, updateGroup, getGroupPreview } from '@/app/actions';
import type { GroupLink, Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type SubmitGroupDialogContentProps = {
  onGroupSubmitted: (group: GroupLink) => void;
  groupToEdit?: GroupLink | null;
  categories: Category[];
  countries: Country[];
}

export function SubmitGroupDialogContent({ onGroupSubmitted, groupToEdit, categories, countries }: SubmitGroupDialogContentProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const isEditMode = !!groupToEdit;

  const [link, setLink] = useState(groupToEdit?.link || '');
  const [title, setTitle] = useState(groupToEdit?.title || '');
  const [description, setDescription] = useState(groupToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState(groupToEdit?.imageUrl || '');
  const [country, setCountry] = useState(groupToEdit?.country || '');
  const [category, setCategory] = useState(groupToEdit?.category || '');
  const [tags, setTags] = useState(groupToEdit?.tags?.join(', ') || '');
  const [type, setType] = useState<'group' | 'channel'>(groupToEdit?.type || 'group');

  useEffect(() => {
    // When opening the dialog, reset the state to match the group to edit, or clear it for a new entry.
    setLink(groupToEdit?.link || '');
    setTitle(groupToEdit?.title || '');
    setDescription(groupToEdit?.description || '');
    setImageUrl(groupToEdit?.imageUrl || '');
    setCountry(groupToEdit?.country || '');
    setCategory(groupToEdit?.category || '');
    setTags(groupToEdit?.tags?.join(', ') || '');
    setType(groupToEdit?.type || 'group');
  }, [groupToEdit, isEditMode]);


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


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startSubmitTransition(async () => {
      const formData = new FormData(e.target as HTMLFormElement);
      // Manually append state values to ensure they are correct
      formData.set('link', link);
      formData.set('title', title);
      formData.set('description', description);
      formData.set('imageUrl', imageUrl);
      formData.set('country', country);
      formData.set('category', category);
      formData.set('tags', tags);
      formData.set('type', type);
      if (isEditMode && groupToEdit) {
        formData.set('id', groupToEdit.id);
      }

      const actionToUse = isEditMode ? updateGroup : submitGroup;
      const result = await actionToUse({ message: '' }, formData);

      if (result.group) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onGroupSubmitted(result.group);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    });
  };

  const areFiltersReady = categories && categories.length > 0 && countries && countries.length > 0;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://whatsapp.com/channel/..."
  };

  const dialogTitle = isEditMode ? 'Edit Group or Channel' : 'Submit a New Group or Channel';
  const dialogDescription = isEditMode
    ? 'Update the details for this entry.'
    : 'Paste a WhatsApp link to fetch its details automatically.';

  return (
    <>
      <div className="p-6 pb-0">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <form id="submit-group-dialog-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-6">
            
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
                <div className="relative">
                    <Input id="link" name="link" type="url" placeholder={placeholders[type]} value={link} onChange={handleLinkChange} />
                    {isFetchingPreview && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://example.com/image.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <p className="text-xs text-muted-foreground">If left blank, a default image will be used.</p>
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
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" value={tags} onChange={(e) => setTags(e.target.value)} />
              <p className="text-xs text-muted-foreground">Separate tags with a comma. All tags will be converted to lowercase.</p>
            </div>
        </form>
      </div>

      <DialogFooter className="p-6 pt-4 border-t bg-background">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogClose>
        <Button form="submit-group-dialog-form" type="submit" disabled={isSubmitting || isFetchingPreview}>
            {(isSubmitting || isFetchingPreview) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Submit Entry'}
        </Button>
      </DialogFooter>
    </>
  );
}

    