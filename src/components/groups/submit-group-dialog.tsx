'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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

const initialState: FormState = {
  message: '',
};

type PreviewData = {
    title?: string;
    description?: string;
    image?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Submit Group'
      )}
    </Button>
  );
}

export function SubmitGroupDialogContent({ onGroupSubmitted }: { onGroupSubmitted: (group: GroupLink) => void }) {
  const [state, formAction] = useActionState(submitGroup, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [link, setLink] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isTransitioning, startTransition] = useTransition();

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    setLink(newLink);
    if (newLink.startsWith('https://chat.whatsapp.com/')) {
        startTransition(async () => {
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


  useEffect(() => {
    if (state.message) {
      if (state.group) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        onGroupSubmitted(state.group);
        formRef.current?.reset();
        setPreview(null);
        setLink('');
      } else {
        toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast, onGroupSubmitted]);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Submit a New Group</DialogTitle>
        <DialogDescription>
          Paste a WhatsApp group link to fetch its details automatically.
        </DialogDescription>
      </DialogHeader>
      <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-4 py-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="link">Group Link</Label>          
          <Input id="link" name="link" type="url" placeholder="https://chat.whatsapp.com/..." required value={link} onChange={handleLinkChange} />
          {state.errors?.link && <p className="text-sm text-destructive">{state.errors.link.join(', ')}</p>}
        </div>

        {(isTransitioning || preview) && (
             <div className="col-span-2 p-4 border rounded-lg bg-muted/50 flex flex-col items-center gap-4">
                {isTransitioning ? (
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
          {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title.join(', ')}</p>}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Group Description</Label>
          <Textarea id="description" name="description" placeholder="A short, catchy description of your group." required defaultValue={preview?.description} readOnly={!!preview?.description} />
          {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description.join(', ')}</p>}
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
          {state.errors?.country && <p className="text-sm text-destructive">{state.errors.country.join(', ')}</p>}
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
          {state.errors?.category && <p className="text-sm text-destructive">{state.errors.category.join(', ')}</p>}
        </div>
        
        <div className="space-y-2 col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" placeholder="e.g., education, lifestyle, crypto" />
          <p className="text-xs text-muted-foreground">Separate tags with a comma.</p>
          {state.errors?.tags && <p className="text-sm text-destructive">{state.errors.tags.join(', ')}</p>}
        </div>

        <DialogFooter className="col-span-2">
          <SubmitButton />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
