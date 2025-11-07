
'use client';

import { useEffect, useTransition, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitGroupSchema } from '@/lib/zod-schemas';
import type { FormState } from '@/lib/types';
import { getGroupPreview, submitGroup } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import type { Category, Country, GroupLink } from '@/lib/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MessagesSquare } from 'lucide-react';

const initialState: FormState = {
  message: '',
};

type FormValues = z.infer<typeof submitGroupSchema>;

export function SubmitGroupForm({ categories, countries, groupToEdit, onSuccess }: SubmitGroupFormProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isFetching, startFetching] = useTransition();
  const [formState, formAction] = useActionState(submitGroup, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(submitGroupSchema),
    defaultValues: {
      link: groupToEdit?.link || '',
      title: groupToEdit?.title || '',
      description: groupToEdit?.description || '',
      imageUrl: groupToEdit?.imageUrl || '',
      imageHint: groupToEdit?.imageHint || '',
      category: groupToEdit?.category || '',
      country: groupToEdit?.country || '',
      type: groupToEdit?.type || 'group',
      tags: groupToEdit?.tags?.join(', ') || '',
    },
  });

  const linkValue = form.watch('link');
  const imageUrl = form.watch('imageUrl');

  const isValidLink = (link: string) => {
    return link.startsWith('https://chat.whatsapp.com/') || link.startsWith('https://www.whatsapp.com/channel/');
  };

  const handleFetchInfo = useCallback(async () => {
    if (!isValidLink(linkValue)) return;

    startFetching(async () => {
        const result = await getGroupPreview(linkValue);
        if (result.success && result.data) {
            form.setValue('title', result.data.title, { shouldValidate: true });
            form.setValue('description', result.data.description, { shouldValidate: true });
            form.setValue('imageUrl', result.data.imageUrl, { shouldValidate: true });
            form.setValue('imageHint', result.data.imageHint, { shouldValidate: true });
            toast({
                title: 'Success!',
                description: 'Group info has been automatically filled.',
            });
        } else {
            toast({
              title: 'Could not fetch info',
              description: result.error || 'The link may be invalid or private.',
              variant: 'destructive',
            })
        }
    });
  }, [linkValue, form, toast]);

  // Debounce effect to auto-fetch info
  useEffect(() => {
    if (!isValidLink(linkValue)) return;

    const handler = setTimeout(() => {
      handleFetchInfo();
    }, 500); // Wait for 500ms after user stops typing

    return () => {
      clearTimeout(handler);
    };
  }, [linkValue, handleFetchInfo]);

  useEffect(() => {
    if (!formState) return;

    if (formState.success) {
      toast({
        title: 'Success!',
        description: formState.message,
        variant: 'default',
      });
      form.reset();
      if (onSuccess) onSuccess();
    } else if (formState.message && !formState.success) {
      toast({
        title: 'Oops!',
        description: formState.message,
        variant: 'destructive',
      });
      if (formState.errors) {
        Object.keys(formState.errors).forEach((key) => {
          const field = key as keyof FormValues;
          const message = formState.errors?.[field]?.[0];
          if (message) {
            form.setError(field, { type: 'server', message });
          }
        });
      }
    }
  }, [formState, form, toast, onSuccess]);
  
  const handleFormAction = (formData: FormData) => {
    startSubmitting(() => {
        formAction(formData);
    });
  }

  return (
    <Form {...form}>
      <form action={handleFormAction} className="space-y-8">
        <Card className="border-primary/20 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6 space-y-8">
                {/* Link Input */}
                <div className="space-y-2">
                    <FormLabel htmlFor="link">Group or Channel Link</FormLabel>
                    <div className="relative">
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem className="flex-1 w-full">
                                <FormControl>
                                    <Input
                                        id="link"
                                        placeholder="https://chat.whatsapp.com/YourInvite"
                                        className="h-12 text-base transition-all focus:scale-[1.01] focus:shadow-lg focus:ring-primary focus:ring-2"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {isFetching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>

                {/* The rest of the form - appears after link is potentially fetched */}
                <div className={cn("space-y-8 transition-opacity duration-500", isFetching && "opacity-50 pointer-events-none")}>
                    
                    {/* Details section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {imageUrl && (
                            <div className="flex flex-col items-center gap-2 md:col-span-1">
                                <Avatar className="h-24 w-24 text-primary border-2 border-primary/10">
                                    <AvatarImage src={imageUrl} alt="Group Preview" />
                                    <AvatarFallback>
                                        <MessagesSquare className="h-10 w-10"/>
                                    </AvatarFallback>
                                </Avatar>
                                <p className='text-xs text-muted-foreground'>Logo Preview</p>
                            </div>
                        )}
                        <div className={cn("space-y-6", imageUrl ? "md:col-span-2" : "md:col-span-3")}>
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl><Input placeholder="e.g., Awesome Gamers Club" {...field} className="transition-all focus:ring-primary focus:ring-2" /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea placeholder="A short, catchy description..." {...field} rows={4} className="transition-all focus:ring-primary focus:ring-2" /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    {/* Hidden fields for image data */}
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (<Input type="hidden" {...field} />)} />
                    <FormField control={form.control} name="imageHint" render={({ field }) => (<Input type="hidden" {...field} />)} />

                    {/* Categorization section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                        <FormControl><SelectTrigger className="transition-all focus:ring-primary focus:ring-2"><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                        <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                        <FormControl><SelectTrigger className="transition-all focus:ring-primary focus:ring-2"><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl>
                                        <SelectContent>{countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3 md:col-span-2">
                                    <FormLabel>Type</FormLabel>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-4" name={field.name}>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="group" /></FormControl>
                                                <FormLabel className="font-normal">Group (Members can chat)</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="channel" /></FormControl>
                                                <FormLabel className="font-normal">Channel (Admins post updates)</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>Tags</FormLabel>
                                <FormControl><Input placeholder="e.g., tech, gaming, movies" {...field} className="transition-all focus:ring-primary focus:ring-2" /></FormControl>
                                <FormDescription>Separate tags with commas. These help people discover your group.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Alert>
                      <AlertTitle>Terms of Service</AlertTitle>
                      <AlertDescription>
                        By submitting this form, you agree to our Terms of Service. Please do not submit any groups with illegal content. All submissions are subject to review.
                      </AlertDescription>
                    </Alert>
                    
                    <Button
                        type="submit"
                        className="w-full text-lg py-6 transition-all hover:scale-[1.02] active:scale-100"
                        disabled={isFetching || isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                      ) : groupToEdit ? 'Update Group' : 'Submit Group'}
                    </Button>
                </div>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
