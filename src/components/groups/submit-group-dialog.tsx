
'use client';
import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { submitGroup, updateGroup, getGroupPreview, type FormState } from '@/app/actions';
import { submitGroupSchema } from '@/lib/zod-schemas';
import type { GroupLink, Category, Country } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import Image from 'next/image';
import { ImageUploader } from '../admin/image-uploader';

type SubmitGroupFormValues = z.infer<typeof submitGroupSchema>;

type SubmitGroupDialogContentProps = {
  onGroupSubmitted: (group: GroupLink) => void;
  groupToEdit?: GroupLink | null;
  categories: Category[];
  countries: Country[];
}

export function SubmitGroupDialogContent({ onGroupSubmitted, groupToEdit, categories, countries }: SubmitGroupDialogContentProps) {
  const { toast } = useToast();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!groupToEdit;

  const form = useForm<SubmitGroupFormValues>({
    resolver: zodResolver(submitGroupSchema),
    defaultValues: {
      link: groupToEdit?.link || '',
      title: groupToEdit?.title || '',
      description: groupToEdit?.description || '',
      imageUrl: groupToEdit?.imageUrl || '',
      country: groupToEdit?.country || '',
      category: groupToEdit?.category || '',
      tags: groupToEdit?.tags?.join(', ') || '',
      type: groupToEdit?.type || 'group',
    }
  });

  useEffect(() => {
    form.reset({
      link: groupToEdit?.link || '',
      title: groupToEdit?.title || '',
      description: groupToEdit?.description || '',
      imageUrl: groupToEdit?.imageUrl || '',
      country: groupToEdit?.country || '',
      category: groupToEdit?.category || '',
      tags: groupToEdit?.tags?.join(', ') || '',
      type: groupToEdit?.type || 'group',
    });
  }, [groupToEdit, form]);

  const watchedType = form.watch('type');
  const watchedImageUrl = form.watch('imageUrl');

  const handleLinkChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLink = e.target.value;
    form.setValue('link', newLink);

    const isFullLink = newLink.startsWith('https://chat.whatsapp.com/') || newLink.includes('whatsapp.com/channel');
    if (isFullLink && !isEditMode) { // Only auto-fetch for new groups
        setIsFetchingPreview(true);
        try {
            const preview = await getGroupPreview(newLink);
            if (preview && !preview.error) {
                form.setValue('title', preview.title || '');
                form.setValue('description', preview.description || '');
                form.setValue('imageUrl', preview.image || '');
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

  const onSubmit = (data: SubmitGroupFormValues) => {
    startTransition(async () => {
      const action = isEditMode ? updateGroup : submitGroup;
      const payload = isEditMode ? { ...data, id: groupToEdit.id } : data;

      const result: FormState = await action(payload as any);

      if (result.group) {
          toast({
              title: 'Success!',
              description: result.message,
          });
          onGroupSubmitted(result.group);
      } else {
          if (result.errors) {
            Object.keys(result.errors).forEach((key) => {
              const field = key as keyof SubmitGroupFormValues;
              const message = result.errors?.[field]?.[0];
              if (message) {
                form.setError(field, { type: 'server', message });
              }
            });
          }
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
    : 'Paste a WhatsApp link to fetch its details automatically, or fill out the form manually.';

  return (
    <>
      <div className="p-6 pb-0">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <form onSubmit={form.handleSubmit(onSubmit)} id="group-form" className="grid grid-cols-2 gap-x-4 gap-y-6">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <div className="space-y-2 col-span-2">
                <Label>Type</Label>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
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
            )}
          />
            
            <div className="space-y-2 col-span-2">
                <Label htmlFor="link">Link</Label>
                <div className="relative">
                    <Input id="link" {...form.register('link')} type="url" placeholder={placeholders[watchedType]} onChange={handleLinkChange} />
                    {isFetchingPreview && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                </div>
                {form.formState.errors.link && <p className="text-sm font-medium text-destructive">{form.formState.errors.link.message}</p>}
                
                {isEditMode ? (
                  <div className="mt-4 space-y-2">
                    <Label>Group Logo</Label>
                    <ImageUploader 
                      currentImageUrl={watchedImageUrl}
                      onUploadComplete={(url) => form.setValue('imageUrl', url, { shouldValidate: true })}
                      onRemove={() => form.setValue('imageUrl', '')}
                    />
                  </div>
                ) : (
                  watchedImageUrl && (
                      <div className="mt-4 flex items-center gap-4 p-4 border rounded-md bg-muted/50">
                          <Image
                              src={watchedImageUrl}
                              alt="Fetched Preview"
                              width={64}
                              height={64}
                              className="w-16 h-16 object-contain rounded-md"
                          />
                          <p className="text-xs text-muted-foreground">
                              Image preview fetched successfully.
                          </p>
                      </div>
                  )
                )}
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g., Awesome Dev Community" {...form.register('title')} />
               {form.formState.errors.title && <p className="text-sm font-medium text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="A short, catchy description of your entry." {...form.register('description')} />
              {form.formState.errors.description && <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>}
            </div>

            <Controller
              name="country"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="country">Country</Label>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!areFiltersReady}>
                    <SelectTrigger id="country">
                        <SelectValue placeholder={!areFiltersReady ? 'Loading...' : 'Select a country'} />
                    </SelectTrigger>
                    <SelectContent>
                        {countries?.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.country && <p className="text-sm font-medium text-destructive">{form.formState.errors.country.message}</p>}
                </div>
              )}
            />

             <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!areFiltersReady}>
                      <SelectTrigger id="category">
                          <SelectValue placeholder={!areFiltersReady ? 'Loading...' : 'Select a category'} />
                      </SelectTrigger>
                      <SelectContent>
                          {categories?.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  {form.formState.errors.category && <p className="text-sm font-medium text-destructive">{form.formState.errors.category.message}</p>}
                </div>
              )}
            />

            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input id="tags" placeholder="e.g., education, lifestyle, crypto" {...form.register('tags')} />
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
            <Button type="submit" disabled={isPending} form="group-form">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Submit Entry'}
            </Button>
        </DialogFooter>
    </>
  );
}
