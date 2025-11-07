
'use client';

import { useEffect, useTransition, useState, useCallback, useRef } from 'react';
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

type SubmitGroupFormProps = {
  categories: Category[];
  countries: Country[];
  groupToEdit?: GroupLink | null;
  onSuccess?: () => void;
};

type FormValues = z.infer<typeof submitGroupSchema>;

export function SubmitGroupForm({ categories, countries, groupToEdit, onSuccess }: SubmitGroupFormProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isFetching, startFetching] = useTransition();

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

  const handleFetchInfo = useCallback(async () => {
    if (!linkValue) return;

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
            form.setError('link', { type: 'manual', message: result.error || 'Failed to fetch group info.' });
        }
    });
  }, [linkValue, form, toast]);

  const onSubmit = (data: FormValues) => {
    startSubmitTransition(async () => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                formData.append(key, value as string);
            }
        });
        
        // Pass a dummy state object, since useActionState is removed
        const formState = await submitGroup({ message: '' }, formData);

        if (formState.success) {
            toast({
                title: 'Success!',
                description: formState.message,
                variant: 'default',
            });
            form.reset();
            if (onSuccess) onSuccess();
        } else {
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
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="border-primary/20 shadow-sm transition-all hover:shadow-md">
            <CardHeader>
                <CardTitle>1. Group Link</CardTitle>
                <CardDescription>Paste the full WhatsApp group or channel invite link below.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-start gap-2">
                    <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                            <FormItem className="flex-1 w-full">
                            <FormControl>
                                <Input
                                    placeholder="https://chat.whatsapp.com/YourGroupInvite"
                                    className="h-12 text-base transition-all focus:scale-[1.01] focus:shadow-lg"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="button"
                        onClick={handleFetchInfo}
                        disabled={isFetching || !linkValue.startsWith('https://chat.whatsapp.com/')}
                        className="w-full sm:w-auto h-12 transition-all hover:scale-105 active:scale-95"
                    >
                        {isFetching ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <><Sparkles className="mr-2 h-5 w-5" /> Auto-fill Info</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div className={cn("space-y-8 transition-opacity duration-500", isFetching && "opacity-50 pointer-events-none")}>
            <Card className="border-primary/20 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle>2. Group Details</CardTitle>
                    <CardDescription>Provide the necessary details for your group. These can be auto-filled from the link.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                         <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Group Title</FormLabel>
                                <FormControl><Input placeholder="e.g., Awesome Gamers Club" {...field} /></FormControl>
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
                                <FormControl><Textarea placeholder="A short, catchy description of your group." {...field} rows={6} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-6">
                        <FormLabel>Group Logo</FormLabel>
                        <div className='flex items-center justify-center p-4 border-2 border-dashed rounded-lg bg-muted/50 aspect-square'>
                            <Image src={form.watch('imageUrl') || '/whatsuplink_logo_and_favicon_without_background.png'} alt="Group logo preview" width={128} height={128} className='rounded-md object-contain' />
                        </div>
                        <FormField control={form.control} name="imageUrl" render={({ field }) => (<Input type="hidden" {...field} />)} />
                        <FormField control={form.control} name="imageHint" render={({ field }) => (<Input type="hidden" {...field} />)} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle>3. Categorization</CardTitle>
                    <CardDescription>Help others find your group by selecting the right category, country, and type.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger></FormControl>
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
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-4">
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
                            <FormControl><Input placeholder="e.g., tech, gaming, movies" {...field} /></FormControl>
                            <FormDescription>Separate tags with commas. These help people discover your group.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Alert>
              <AlertTitle>Terms of Service</AlertTitle>
              <AlertDescription>
                By submitting this form, you agree to our Terms of Service. Please do not submit any groups with illegal content. All submissions are subject to review.
              </AlertDescription>
            </Alert>
            
            <Button
                type="submit"
                className="w-full text-lg py-6 transition-all hover:scale-[1.02] active:scale-100"
                disabled={isSubmitting || isFetching}
            >
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <>{groupToEdit ? 'Update Group' : 'Submit Group'}</>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
