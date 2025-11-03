'use client';
import { useRef, useState, useTransition, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Link as LinkIcon, Search } from 'lucide-react';
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

function SubmitButton({ isEditMode, isFetchingPreview, areFiltersReady }: { isEditMode: boolean; isFetchingPreview: boolean; areFiltersReady: boolean; }) {
    const { pending } = useFormStatus();
    
    const getButtonContent = () => {
        if (pending) {
            return (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Saving...' : 'Processing...'}
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
        return isEditMode ? 'Save Changes' : 'Submit Entry';
    }

    return (
        <Button form="submit-group-form" type="submit" disabled={pending || isFetchingPreview || !areFiltersReady}>
            {getButtonContent()}
        </Button>
    );
}


export function SubmitGroupDialogContent({ onGroupSubmitted, groupToEdit, categories, countries }: SubmitGroupDialogContentProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!groupToEdit;
  
  const [type, setType] = useState<'group' | 'channel'>(groupToEdit?.type || 'group');
  const [preview, setPreview] = useState<PreviewData | null>(groupToEdit ? { image: groupToEdit.imageUrl, title: groupToEdit.title, description: groupToEdit.description } : null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();

  const areFiltersReady = categories && categories.length > 0 && countries && countries.length > 0;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://www.whatsapp.com/channel/..."
  };

  const initialState: FormState = { message: '', errors: {} };
  const action = isEditMode ? updateGroup : submitGroup;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.group) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        onGroupSubmitted(state.group);
      } else {
        const errorMsg = 
            state.errors?.link?.[0] || 
            state.errors?.title?.[0] || 
            state.errors?.description?.[0] || 
            state.errors?.category?.[0] || 
            state.errors?.country?.[0] || 
            state.errors?._form?.[0] ||
            state.message;
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      }
    }
  }, [state, onGroupSubmitted, toast]);

  useEffect(() => {
    if (groupToEdit) {
      setType(groupToEdit.type);
      setPreview({
        title: groupToEdit.title,
        description: groupToEdit.description,
        image: groupToEdit.imageUrl,
      });
      // We set the value directly on the uncontrolled input
      if (linkInputRef.current) {
        linkInputRef.current.value = groupToEdit.link;
      }
    } else {
        setType('group');
        setPreview(null);
        if (formRef.current) formRef.current.reset();
    }
  }, [groupToEdit]);


  const handleFetchPreview = () => {
    const newLink = linkInputRef.current?.value || '';
    if (!newLink) return;

    const isGroupLink = newLink.startsWith('https://chat.whatsapp.com/');
    const isChannelLink = newLink.includes('whatsapp.com/channel');
    const isValidForType = (type === 'group' && isGroupLink) || (type === 'channel' && isChannelLink);

    if (isValidForType) {
        startFetchingPreview(async () => {
            const result = await getGroupPreview(newLink);
            if (result && !result.error) {
                setPreview(result);
                 if (formRef.current) {
                    (formRef.current.elements.namedItem('title') as HTMLInputElement).value = result.title || '';
                    (formRef.current.elements.namedItem('description') as HTMLTextAreaElement).value = result.description || '';
                    (formRef.current.elements.namedItem('imageUrl') as HTMLInputElement).value = result.image || '';
                }
            } else {
                toast({
                  title: 'Error Fetching Preview',
                  description: result.error || 'Could not fetch group preview. The link may be invalid or private.',
                  variant: 'destructive',
                })
                setPreview(null);
            }
        });
    } else {
        toast({
          title: 'Invalid Link Type',
          description: "The link format doesn't match the selected type (group or channel).",
          variant: 'destructive',
        })
        setPreview(null);
    }
  };


  const title = isEditMode ? 'Edit Group or Channel' : 'Submit a New Group or Channel';
  const description = isEditMode
    ? 'Update the details for this entry.'
    : 'Select a type, paste a WhatsApp link, and fetch its details.';

  return (
    <>
      <div className="p-6 pb-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <form ref={formRef} action={formAction} id="submit-group-form" className="grid grid-cols-2 gap-x-4 gap-y-6">
            {isEditMode && <input type="hidden" name="id" value={groupToEdit.id} />}
            
            <div className="space-y-2 col-span-2">
              <Label>Type</Label>
              <RadioGroup name="type" defaultValue={type} onValueChange={(v: 'group' | 'channel') => {
                  setType(v);
                  setPreview(null);
                   if (linkInputRef.current) linkInputRef.current.value = '';
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
                <div className="flex items-center gap-2">
                    <Input id="link" name="link" type="url" placeholder={placeholders[type]} ref={linkInputRef} defaultValue={groupToEdit?.link || ''} />
                    <Button type="button" variant="secondary" onClick={handleFetchPreview} disabled={isFetchingPreview}>
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Fetch Preview</span>
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
              <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" defaultValue={preview?.title || groupToEdit?.title} />
              {state.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." defaultValue={preview?.description || groupToEdit?.description} />
              {state.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
            </div>
            
            <input type="hidden" name="imageUrl" defaultValue={preview?.image || groupToEdit?.imageUrl || ''} />

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
               {state.errors?.country && <p className="text-sm font-medium text-destructive">{state.errors.country[0]}</p>}
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
              {state.errors?.category && <p className="text-sm font-medium text-destructive">{state.errors.category[0]}</p>}
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
        <SubmitButton isEditMode={isEditMode} isFetchingPreview={isFetchingPreview} areFiltersReady={areFiltersReady} />
      </DialogFooter>
    </>
  );
}
