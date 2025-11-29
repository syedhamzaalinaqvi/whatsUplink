
'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Plus, Trash2, GripVertical, Image as ImageIcon, FileText, Search as SearchIcon } from 'lucide-react';
import type { LayoutSettings, NavLink } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { saveLayoutSettings } from '@/app/admin/actions';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';

const layoutSettingsSchema = z.object({
  logoUrl: z.string().optional().or(z.literal('')),
  navLinks: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, 'Label is required.'),
      href: z.string().min(1, 'URL is required.'),
    })
  ),
  footerContent: z.object({
    heading: z.string().min(1, 'Heading is required.'),
    paragraph: z.string().min(1, 'Paragraph is required.'),
    copyrightText: z.string().min(1, 'Copyright text is required.'),
  }),
  backgroundSettings: z.object({
    bgImageEnabled: z.boolean(),
    bgImageUrl: z.string().optional(),
  }),
  homepageSeoContent: z.object({
    enabled: z.boolean(),
    heading: z.string().min(5, 'Heading must be at least 5 characters.'),
    content: z.string().min(20, 'Content must be at least 20 characters.'),
  }),
  seoSettings: z.object({
      siteTitle: z.string().min(5, "Site title must be at least 5 characters."),
      metaDescription: z.string().min(20, "Meta description must be at least 20 characters."),
      metaKeywords: z.string().optional(),
  })
});

type FormValues = z.infer<typeof layoutSettingsSchema>;

type AdminLayoutSettingsProps = {
  initialSettings: LayoutSettings;
  onSettingsChange: (newSettings: LayoutSettings) => void;
};

export function AdminLayoutSettings({ initialSettings, onSettingsChange }: AdminLayoutSettingsProps) {
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(layoutSettingsSchema),
    defaultValues: {
      logoUrl: initialSettings.logoUrl || '',
      navLinks: initialSettings.navLinks.map(link => ({...link})), // Ensure mutable copy
      footerContent: { ...initialSettings.footerContent },
      backgroundSettings: { ...initialSettings.backgroundSettings },
      homepageSeoContent: { ...initialSettings.homepageSeoContent },
      seoSettings: { ...initialSettings.seoSettings },
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "navLinks",
  });

  const onSubmit = (data: FormValues) => {
    startSaving(async () => {
        const formData = new FormData();
        formData.append('logoUrl', data.logoUrl || '');
        formData.append('navLinks', JSON.stringify(data.navLinks));
        formData.append('footerHeading', data.footerContent.heading);
        formData.append('footerParagraph', data.footerContent.paragraph);
        formData.append('footerCopyright', data.footerContent.copyrightText);
        formData.append('bgImageEnabled', data.backgroundSettings.bgImageEnabled ? 'on' : 'off');
        formData.append('bgImageUrl', data.backgroundSettings.bgImageUrl || '');
        formData.append('seoEnabled', data.homepageSeoContent.enabled ? 'on' : 'off');
        formData.append('seoHeading', data.homepageSeoContent.heading);
        formData.append('seoContent', data.homepageSeoContent.content);
        formData.append('siteTitle', data.seoSettings.siteTitle);
        formData.append('metaDescription', data.seoSettings.metaDescription);
        formData.append('metaKeywords', data.seoSettings.metaKeywords || '');

        const result = await saveLayoutSettings(formData);

        if (result.success) {
            onSettingsChange(data);
        }

        toast({
            title: result.success ? 'Success' : 'Error',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Layout &amp; Appearance</CardTitle>
        <CardDescription>
          Customize your site's logo, background, header, footer, and navigation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><SearchIcon className='h-5 w-5'/> Homepage SEO</CardTitle>
                    <CardDescription>Manage your homepage title, description, and keywords for search engines.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="seoSettings.siteTitle"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Site Title</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="WhatsUpLink: The Best Group Directory" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoSettings.metaDescription"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl>
                                <Textarea {...field} placeholder="Your one-stop directory for all WhatsApp groups..." rows={3} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoSettings.metaKeywords"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Meta Keywords</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="whatsapp groups, group links, community..." />
                            </FormControl>
                            <p className='text-sm text-muted-foreground'>Separate keywords with a comma.</p>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><FileText className='h-5 w-5'/> Homepage SEO Content</CardTitle>
                    <CardDescription>Manage the SEO content block on your homepage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="homepageSeoContent.enabled"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel htmlFor="seo-toggle" className="text-base">Show SEO Section</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Toggle the visibility of the SEO content block on the homepage.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                        id="seo-toggle"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {form.watch('homepageSeoContent.enabled') && (
                        <div className='space-y-4'>
                            <FormField
                                control={form.control}
                                name="homepageSeoContent.heading"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>SEO Heading</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Your Ultimate Hub for..." />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="homepageSeoContent.content"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>SEO Content</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Welcome to WhatsUpLink..." rows={10} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ImageIcon className='h-5 w-5'/> Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="backgroundSettings.bgImageEnabled"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel htmlFor="bg-toggle" className="text-base">Enable Custom Background Image</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Use a custom image for the site background.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                        id="bg-toggle"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    {form.watch('backgroundSettings.bgImageEnabled') && (
                        <FormField
                            control={form.control}
                            name="backgroundSettings.bgImageUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Background Image URL</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="/your-background.png" />
                                </FormControl>
                                <p className='text-sm text-muted-foreground'>Enter the path to your image file in the `public` folder.</p>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </CardContent>
            </Card>
            
            {/* Site Logo */}
            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="/path-to-your-logo.png" />
                  </FormControl>
                  <p className='text-sm text-muted-foreground'>Manually enter the path to your logo file in the `public` folder. This will also be used as the site favicon.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Navigation Links */}
            <div className="space-y-4">
              <FormLabel>Navigation Links</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                   <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                   <FormField
                    control={form.control}
                    name={`navLinks.${index}.label`}
                    render={({ field }) => (
                      <Input placeholder="Label" {...field} className='flex-1' />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`navLinks.${index}.href`}
                    render={({ field }) => (
                      <Input placeholder="/url" {...field} className='flex-1'/>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
               <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ id: `new-${Date.now()}`, label: '', href: '' })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                </Button>
            </div>

            {/* Footer Content */}
            <div className='space-y-6'>
                <FormLabel>Footer Content</FormLabel>
                <FormField
                control={form.control}
                name="footerContent.heading"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className='text-xs'>Heading</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="footerContent.paragraph"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className='text-xs'>Paragraph</FormLabel>
                    <FormControl>
                        <Textarea {...field} rows={3}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="footerContent.copyrightText"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className='text-xs'>Copyright Text</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Layout Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    
