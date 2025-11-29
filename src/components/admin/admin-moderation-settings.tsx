
'use client';

import { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ModerationSettings } from '@/lib/data';
import { saveModerationSettings } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { LayoutGrid, List, Loader2, SlidersHorizontal, FileText, Star, Eye, Zap } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Slider } from '../ui/slider';

const moderationSettingsSchema = z.object({
    showClicks: z.boolean(),
    cooldownEnabled: z.boolean(),
    cooldownValue: z.coerce.number().min(1, 'Must be at least 1'),
    cooldownUnit: z.enum(['hours', 'days', 'months']),
    groupsPerPage: z.coerce.number().min(1, 'Must be at least 1').max(100, 'Cannot be more than 100'),
    showFeatured: z.boolean(),
    featuredGroupsDisplay: z.enum(['slider', 'grid', 'list']),
    showNewsletter: z.boolean(),
    showDynamicSeoContent: z.boolean(),
    showRatings: z.boolean(),
    showTicker: z.boolean(),
    tickerSpeed: z.number().min(5).max(100),
});

type ModerationFormValues = z.infer<typeof moderationSettingsSchema>;

type AdminModerationSettingsProps = {
    initialSettings: ModerationSettings;
    onSettingsChange: (settings: ModerationSettings) => void;
};

export function AdminModerationSettings({ initialSettings, onSettingsChange }: AdminModerationSettingsProps) {
    const { toast } = useToast();
    const [isSaving, startSaving] = useTransition();

    const form = useForm<ModerationFormValues>({
        resolver: zodResolver(moderationSettingsSchema),
        defaultValues: {
            ...initialSettings
        },
    });

    useEffect(() => {
        form.reset(initialSettings);
    }, [initialSettings, form]);

    const onSubmit = (data: ModerationFormValues) => {
        startSaving(async () => {
            const formData = new FormData();
            formData.append('cooldownEnabled', data.cooldownEnabled ? 'on' : 'off');
            formData.append('cooldownValue', String(data.cooldownValue));
            formData.append('cooldownUnit', data.cooldownUnit);
            formData.append('groupsPerPage', String(data.groupsPerPage));
            formData.append('showFeatured', data.showFeatured ? 'on' : 'off');
            formData.append('featuredGroupsDisplay', data.featuredGroupsDisplay);
            formData.append('showNewsletter', data.showNewsletter ? 'on' : 'off');
            formData.append('showDynamicSeoContent', data.showDynamicSeoContent ? 'on' : 'off');
            formData.append('showRatings', data.showRatings ? 'on' : 'off');
            formData.append('showClicks', data.showClicks ? 'on' : 'off');
            formData.append('showTicker', data.showTicker ? 'on' : 'off');
            formData.append('tickerSpeed', String(data.tickerSpeed));
            
            const result = await saveModerationSettings(formData);

            if (result.success) {
                 onSettingsChange({ ...initialSettings, ...data });
            }

            toast({
                title: result.success ? 'Success' : 'Error',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Global Settings</CardTitle>
                <CardDescription>Manage display and submission settings for your directory.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Display Settings Column */}
                            <div className="space-y-6">
                                <h4 className="font-semibold text-lg">Display Settings</h4>
                                
                                <FormField
                                    control={form.control}
                                    name="showClicks"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel htmlFor="show-clicks-toggle" className="text-base flex items-center gap-2">
                                                    <Eye className="h-4 w-4" /> Show Click Counts
                                                </FormLabel>
                                                <p className="text-sm text-muted-foreground">
                                                    Display join link click counts publicly.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    id="show-clicks-toggle"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="showRatings"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel htmlFor="show-ratings-toggle" className="text-base flex items-center gap-2">
                                                    <Star className='h-4 w-4' /> Show Ratings
                                                </FormLabel>
                                                <p className="text-sm text-muted-foreground">
                                                    Display the 5-star rating system.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    id="show-ratings-toggle"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="showNewsletter"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel htmlFor="show-newsletter-toggle" className="text-base">Show Newsletter Form</FormLabel>
                                                <p className="text-sm text-muted-foreground">
                                                    Display newsletter signup form in footer.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    id="show-newsletter-toggle"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="groupsPerPage"
                                    render={({ field }) => (
                                        <FormItem className="rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Groups Per Page</FormLabel>
                                                <p className="text-sm text-muted-foreground">
                                                    Set how many groups load on the homepage at a time.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Input type="number" {...field} className="mt-2" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <div className="space-y-4 rounded-lg border p-4">
                                    <FormField
                                        control={form.control}
                                        name="showFeatured"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <FormLabel htmlFor="show-featured-toggle" className="text-base flex items-center gap-2">
                                                        Show Featured Section
                                                    </FormLabel>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enable or disable the featured section on the homepage.
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        id="show-featured-toggle"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="featuredGroupsDisplay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Display Style</FormLabel>
                                                <FormControl>
                                                    <ToggleGroup
                                                        type="single"
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        className="justify-start mt-2"
                                                        defaultValue="slider"
                                                        disabled={!form.watch('showFeatured')}
                                                    >
                                                        <ToggleGroupItem value="slider" aria-label="Slider view">
                                                            <SlidersHorizontal className="h-4 w-4 mr-2" />
                                                            Slider
                                                        </ToggleGroupItem>
                                                        <ToggleGroupItem value="grid" aria-label="Grid view">
                                                            <LayoutGrid className="h-4 w-4 mr-2" />
                                                            Grid
                                                        </ToggleGroupItem>
                                                        <ToggleGroupItem value="list" aria-label="List view">
                                                            <List className="h-4 w-4 mr-2" />
                                                            List
                                                        </ToggleGroupItem>
                                                    </ToggleGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Moderation Settings Column */}
                            <div className="space-y-6">
                                <h4 className="font-semibold text-lg">Content & Moderation</h4>
                                <div className="space-y-6 rounded-lg border p-4">
                                    <FormField
                                        control={form.control}
                                        name="cooldownEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Enable Resubmission Cooldown</FormLabel>
                                                    <p className="text-sm text-muted-foreground">
                                                        Prevent spam by limiting resubmissions of the same link.
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch('cooldownEnabled') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="cooldownValue"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cooldown Period</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="cooldownUnit"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Unit</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a unit" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="hours">Hours</SelectItem>
                                                                <SelectItem value="days">Days</SelectItem>
                                                                <SelectItem value="months">Months</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                                <FormField
                                    control={form.control}
                                    name="showDynamicSeoContent"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel htmlFor="show-dynamic-seo-toggle" className="text-base flex items-center gap-2">
                                                    <FileText className='h-4 w-4'/> Show Dynamic SEO Block
                                                </FormLabel>
                                                <p className="text-sm text-muted-foreground">
                                                    Show SEO text on category/country pages.
                                                </p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    id="show-dynamic-seo-toggle"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                 <Card>
                                    <CardHeader className='pb-4'>
                                        <CardTitle className='text-lg flex items-center gap-2'><Zap className='h-5 w-5'/> Ticker Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className='space-y-6'>
                                        <FormField
                                            control={form.control}
                                            name="showTicker"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel htmlFor="show-ticker-toggle" className="text-base">Show Ticker</FormLabel>
                                                        <p className="text-sm text-muted-foreground">
                                                            Enable the sports/news ticker on the homepage.
                                                        </p>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            id="show-ticker-toggle"
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="tickerSpeed"
                                            render={({ field }) => (
                                                <FormItem className="rounded-lg border p-4">
                                                    <div className='flex justify-between items-center'>
                                                        <FormLabel className="text-base">Ticker Speed</FormLabel>
                                                        <span className="text-sm font-mono text-muted-foreground">{field.value}s</span>
                                                    </div>
                                                     <p className="text-sm text-muted-foreground pb-2">
                                                        Animation duration. Higher is slower.
                                                    </p>
                                                    <FormControl>
                                                        <Slider
                                                            min={5}
                                                            max={100}
                                                            step={1}
                                                            value={[field.value]}
                                                            onValueChange={(value) => field.onChange(value[0])}
                                                            disabled={!form.watch('showTicker')}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save All Settings
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
