
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
import { Loader2, Plus, Trash2, GripVertical, Image as ImageIcon, FileText } from 'lucide-react';
import type { LayoutSettings, NavLink } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { saveLayoutSettings } from '@/app/admin/actions';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';

const layoutSettingsSchema = z.object({
  logoUrl: z.string().optional().or(z.literal('')),
  headerScripts: z.string().optional(),
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
  seoContent: z.object({
    enabled: z.boolean(),
    heading: z.string().min(5, 'Heading must be at least 5 characters.'),
    content: z.string().min(20, 'Content must be at least 20 characters.'),
  }),
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
      headerScripts: initialSettings.headerScripts || '',
      logoUrl: initialSettings.logoUrl || '',
      navLinks: initialSettings.navLinks.map(link => ({...link})), // Ensure mutable copy
      footerContent: { ...initialSettings.footerContent },
      backgroundSettings: { ...initialSettings.backgroundSettings },
      seoContent: { ...initialSettings.seoContent },
    },
  });
  
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "navLinks",
  });

  const onSubmit = (data: FormValues) => {
    startSaving(async () => {
        const formData = new FormData();
        formData.append('headerScripts', data.headerScripts || '');
        formData.append('logoUrl', data.logoUrl || '');
        formData.append('navLinks', JSON.stringify(data.navLinks));
        formData.append('footerHeading', data.footerContent.heading);
        formData.append('footerParagraph', data.footerContent.paragraph);
        formData.append('footerCopyright', data.footerContent.copyrightText);
        formData.append('bgImageEnabled', data.backgroundSettings.bgImageEnabled ? 'on' : 'off');
        formData.append('bgImageUrl', data.backgroundSettings.bgImageUrl || '');
        formData.append('seoEnabled', data.seoContent.enabled ? 'on' : 'off');
        formData.append('seoHeading', data.seoContent.heading);
        formData.append('seoContent', data.seoContent.content);

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
        <CardTitle>Layout & Appearance</CardTitle>
        <CardDescription>
          Customize your site's logo, background, header, footer, navigation, and add tracking scripts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><FileText className='h-5 w-5'/> SEO Content</CardTitle>
                    <CardDescription>Manage the SEO content block on your homepage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="seoContent.enabled"
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
                    {form.watch('seoContent.enabled') && (
                        <div className='space-y-4'>
                            <FormField
                                control={form.control}
                                name="seoContent.heading"
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
                                name="seoContent.content"
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

            {/* Header Scripts */}
            <FormField
              control={form.control}
              name="headerScripts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Header Scripts</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<script>...</script>"
                      className="font-mono"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <p className='text-sm text-muted-foreground'>Add scripts like Google Analytics here. They will be injected into the page body.</p>
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
