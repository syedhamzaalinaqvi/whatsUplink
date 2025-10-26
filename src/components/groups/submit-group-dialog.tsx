'use client';
import { useRef, useState, useTransition } from 'react';
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
import { submitGroup, getGroupPreview, type FormState } from '@/app/actions';
import type { GroupLink } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';
import { Textarea } from '../ui/textarea';

type PreviewData = {
    title?: string;
    description?: string;
    image?: string;
};

export function SubmitGroupDialogContent({ onGroupSubmitted }: { onGroupSubmitted: (group: GroupLink) => void }) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [link, setLink] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isFetchingPreview, startFetchingPreview] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

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
      const result = await submitGroup({ message: '' }, formData);

      if (result.group) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onGroupSubmitted(result.group);
        formRef.current?.reset();
        setPreview(null);
        setLink('');
      } else {
        // In case of error, we don't reset the form so the user can fix it.
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
        <DialogTitle>Submit a New Group</DialogTitle>
        <DialogDescription>
          Paste a WhatsApp group link to fetch its details automatically.
        </DialogDescription>
      </DialogHeader>
      <form ref={formRef} action={handleFormSubmit} className="grid grid-cols-2 gap-4 py-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="link">Group Link</Label>          
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
          <Label htmlFor="title">Group Title</Label>
          <Input id="title" name="title" placeholder="e.g., Awesome Dev Community" required defaultValue={preview?.title} readOnly={!!preview?.title}/>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Group Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your group." required defaultValue={preview?.description} readOnly={!!preview?.description} />
        </div>
        
        <input type="hidden" name="imageUrl" value={preview?.image || ''} />

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select name="country" required>
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
          <Select name="category" required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.filter(c => c.value !== 'all' && c.value !== 'new').map(category => (
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

        <DialogFooter className="col-span-2">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
                </>
            ) : (
                'Submit Group'
            )}
            </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
