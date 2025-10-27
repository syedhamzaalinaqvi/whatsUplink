
'use client';
import { useRef, useState, useTransition, useEffect } from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, getGroupPreview } from '@/app/actions';
import { updateGroup } from '@/app/admin/actions';
import type { GroupLink } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type PreviewData = {
    title?: string;
    description?: string;
    image?: string;
};

type SubmitGroupDialogContentProps = {
    onGroupSubmitted: (group: GroupLink) => void;
    groupToEdit?: GroupLink | null;
}

export function SubmitGroupDialogContent({ onGroupSubmitted, groupToEdit }: SubmitGroupDialogContentProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [link, setLink] = useState(groupToEdit?.link || '');
  const [preview, setPreview] = useState<PreviewData | null>(groupToEdit ? { image: groupToEdit.imageUrl, title: groupToEdit.title, description: groupToEdit.description } : null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const isEditMode = !!groupToEdit;
  
  // Effect to reset form when editing a new group or closing dialog
  useEffect(() => {
    setLink(groupToEdit?.link || '');
    setPreview(groupToEdit ? { image: groupToEdit.imageUrl, title: groupToEdit.title, description: groupToEdit.description } : null);
    formRef.current?.reset();
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
      if (isEditMode && groupToEdit) {
          formData.append('id', groupToEdit.id);
      }
      
      const result = await action({ message: '' }, formData);

      if (result.group) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onGroupSubmitted(result.group);
        // Do not reset form here, the dialog will close.
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Entry' : 'Submit a New Group or Channel'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? 'Update the details for this entry.' : 'Paste a WhatsApp group or channel link to fetch its details automatically.'}
        </DialogDescription>
      </DialogHeader>
      <form ref={formRef} action={handleFormSubmit} className="grid grid-cols-2 gap-4 py-4">
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
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" required defaultValue={groupToEdit?.title || preview?.title} key={groupToEdit?.id} readOnly={!!preview?.title && !isEditMode}/>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your entry." required defaultValue={groupToEdit?.description || preview?.description} key={groupToEdit?.id} />
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


        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select name="country" required defaultValue={groupToEdit?.country}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.filter(c => c.value !== 'all').map(country => (
                <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" required defaultValue={groupToEdit?.category}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter(c => c.value !== 'all').map(category => (
                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" defaultValue={groupToEdit?.tags.join(', ')} key={groupToEdit?.id}/>
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
        </div>

        <DialogFooter className="col-span-2">
            <Button type="submit" disabled={isSubmitting || isFetchingPreview} className="w-full sm:w-auto">
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
            ): (
                isEditMode ? 'Save Changes' : 'Submit Entry'
            )}
            </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
