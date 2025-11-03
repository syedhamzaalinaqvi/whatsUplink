
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
  
  const [type, setType] = useState<'group' | 'channel'>(groupToEdit?.type || 'group');
  const [preview, setPreview] = useState<PreviewData | null>(groupToEdit ? { image: groupToEdit.imageUrl, title: groupToEdit.title, description: groupToEdit.description } : null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const areFiltersReady = categories && categories.length > 0 && countries && countries.length > 0;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://www.whatsapp.com/channel/..."
  };

  useEffect(() => {
    if (groupToEdit) {
      setType(groupToEdit.type);
      setPreview({
        title: groupToEdit.title,
        description: groupToEdit.description,
        image: groupToEdit.imageUrl,
      });
    } else {
        setType('group');
        setPreview(null);
        formRef.current?.reset();
    }
  }, [groupToEdit]);


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
          description: result.errors?.link?.[0] || result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const title = isEditMode ? 'Edit Group or Channel' : 'Submit a New Group or Channel';
  const description = isEditMode
    ? 'Update the details for this entry.'
    : 'Select a type, then paste a WhatsApp link to fetch its details automatically.';

  return (
    <>
      <DialogHeader className="p-6 pb-4">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto px-6">
        <form ref={formRef} action={handleFormSubmit} id="submit-group-form" className="grid grid-cols-2 gap-x-4 gap-y-6">
            {isEditMode && <input type="hidden" name="id" value={groupToEdit.id} />}
            
            <div className="space-y-2 col-span-2">
              <Label>Type</Label>
              <RadioGroup name="type" required value={type} onValueChange={(v: 'group' | 'channel') => {
                  setType(v);
                  setPreview(null);
                  if (formRef.current) {
                    const linkInput = formRef.current.elements.namedItem('link') as HTMLInputElement;
                    if(linkInput) linkInput.value = '';
                  }
              }} className="flex gap-4">
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
              <Input id="link" name="link" type="url" placeholder={placeholders[type]} required defaultValue={groupToEdit?.link || ''} onChange={handleLinkChange} />
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
              <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" required defaultValue={preview?.title || groupToEdit?.title} key={`title-${preview?.title || groupToEdit?.id}`} readOnly={!isEditMode && !!preview?.title}/>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." required defaultValue={preview?.description || groupToEdit?.description} key={`desc-${preview?.description || groupToEdit?.id}`} />
            </div>
            
            <input type="hidden" name="imageUrl" value={preview?.image || groupToEdit?.imageUrl || ''} />

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
              <p className="text-xs text-muted-foreground">Separate tags with a comma. All tags will be converted to lowercase.</p>
            </div>
        </form>
      </div>

      <DialogFooter className="p-6 pt-4 border-t bg-background">
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
    </>
  );
}
