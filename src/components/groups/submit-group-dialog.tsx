'use client';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitGroup, type FormState } from '@/app/actions';
import type { GroupLink } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';

const initialState: FormState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        'Submit Group'
      )}
    </Button>
  );
}

export function SubmitGroupDialogContent({ onGroupSubmitted }: { onGroupSubmitted: (group: GroupLink) => void }) {
  const [state, formAction] = useFormState(submitGroup, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.group) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        onGroupSubmitted(state.group);
        formRef.current?.reset();
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
          Share a WhatsApp group with the community. Please provide a clear title and description.
        </DialogDescription>
      </DialogHeader>
      <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="title">Group Title</Label>
          <Input id="title" name="title" placeholder="e.g., 'React Developers'" required />
          {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title.join(', ')}</p>}
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="A brief description of the group's purpose."
            required
          />
          {state.errors?.description && <p className="text-sm text-destructive">{state.errors.description.join(', ')}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select name="country">
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
          <Select name="category">
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
          <Label htmlFor="link">Group Link</Label>          
          <Input id="link" name="link" type="url" placeholder="https://chat.whatsapp.com/..." required />
          {state.errors?.link && <p className="text-sm text-destructive">{state.errors.link.join(', ')}</p>}
        </div>
        <DialogFooter className="col-span-2">
          <SubmitButton />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
