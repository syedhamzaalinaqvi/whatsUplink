'use client';
import { useRef, useState, useTransition, useEffect } from 'react';
import { useActionState } from 'react';
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
import { submitGroup, updateGroup, type FormState } from '@/app/actions';
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

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
    const [isPending, setIsPending] = useState(false);
    
    // This is a workaround to get form status.
    useEffect(() => {
        const form = document.getElementById('submit-group-dialog-form');
        if (!form) return;

        const handleStart = () => setIsPending(true);
        const handleEnd = () => setIsPending(false);

        form.addEventListener('submit', handleStart);
        // We'll use a custom event to signal when submission is complete.
        form.addEventListener('submit-complete', handleEnd);

        return () => {
            form.removeEventListener('submit', handleStart);
            form.removeEventListener('submit-complete', handleEnd);
        };
    }, []);

    return (
        <Button form="submit-group-dialog-form" type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Submit Entry'}
        </Button>
    );
}


export function SubmitGroupDialogContent({ onGroupSubmitted, groupToEdit, categories, countries }: SubmitGroupDialogContentProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!groupToEdit;
  
  const [type, setType] = useState<'group' | 'channel'>(groupToEdit?.type || 'group');

  const areFiltersReady = categories && categories.length > 0 && countries && countries.length > 0;
  
  const placeholders = {
    group: "https://chat.whatsapp.com/...",
    channel: "https://whatsapp.com/channel/..."
  };

  const initialState: FormState = { message: '', errors: {} };
  const actionToUse = isEditMode ? updateGroup : submitGroup;
  const [state, formAction] = useActionState(actionToUse, initialState);

  useEffect(() => {
    // Dispatch event to stop pending state on button
    if (formRef.current) {
        formRef.current.dispatchEvent(new Event('submit-complete'));
    }

    if (state.message) {
        const variant = state.group ? 'default' : 'destructive';
        toast({
            title: state.group ? 'Success!' : 'Error',
            description: state.message,
            variant: variant
        });
        if (state.group) {
            onGroupSubmitted(state.group);
        }
    }
  }, [state, onGroupSubmitted, toast]);
  
  useEffect(() => {
    // Reset form fields when the dialog is opened for a new entry
    if (!isEditMode && formRef.current) {
        formRef.current.reset();
        setType('group');
    }
  }, [isEditMode, groupToEdit]);


  const title = isEditMode ? 'Edit Group or Channel' : 'Submit a New Group or Channel';
  const description = isEditMode
    ? 'Update the details for this entry.'
    : 'All fields are required. Please fill out the form completely.';


  return (
    <>
      <div className="p-6 pb-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <form ref={formRef} action={formAction} id="submit-group-dialog-form" className="grid grid-cols-2 gap-x-4 gap-y-6">
            
            {isEditMode && groupToEdit?.id && <input type="hidden" name="id" value={groupToEdit.id} />}

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
                <Input id="link" name="link" type="url" placeholder={placeholders[type]} defaultValue={groupToEdit?.link} />
                 {state?.errors?.link && <p className="text-sm font-medium text-destructive">{state.errors.link[0]}</p>}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" defaultValue={groupToEdit?.title || ''} />
               {state?.errors?.title && <p className="text-sm font-medium text-destructive">{state.errors.title[0]}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." defaultValue={groupToEdit?.description || ''} />
              {state?.errors?.description && <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://example.com/image.png" defaultValue={groupToEdit?.imageUrl}/>
              <p className="text-xs text-muted-foreground">If left blank, a default image will be used.</p>
              {state?.errors?.imageUrl && <p className="text-sm font-medium text-destructive">{state.errors.imageUrl[0]}</p>}
            </div>

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
               {state?.errors?.country && <p className="text-sm font-medium text-destructive">{state.errors.country[0]}</p>}
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
               {state?.errors?.category && <p className="text-sm font-medium text-destructive">{state.errors.category[0]}</p>}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" defaultValue={groupToEdit?.tags?.join(', ')} />
              <p className="text-xs text-muted-foreground">Separate tags with a comma. All tags will be converted to lowercase.</p>
               {state?.errors?.tags && <p className="text-sm font-medium text-destructive">{state.errors.tags[0]}</p>}
            </div>
        </form>
      </div>

      <DialogFooter className="p-6 pt-4 border-t bg-background">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton isEditMode={isEditMode} />
      </DialogFooter>
    </>
  );
}
