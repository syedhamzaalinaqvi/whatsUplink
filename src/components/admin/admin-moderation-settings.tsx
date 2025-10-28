
'use client';

import { useTransition, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ModerationSettings } from '@/lib/data';
import { saveModerationSettings, toggleShowClicks } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const moderationSettingsSchema = z.object({
    cooldownEnabled: z.boolean(),
    cooldownValue: z.coerce.number().min(1, 'Must be at least 1'),
    cooldownUnit: z.enum(['hours', 'days', 'months']),
    groupsPerPage: z.coerce.number().min(1, 'Must be at least 1').max(100, 'Cannot be more than 100'),
});

type ModerationFormValues = z.infer<typeof moderationSettingsSchema>;

type AdminModerationSettingsProps = {
    initialSettings: ModerationSettings;
    onSettingsChange: (settings: ModerationSettings) => void;
};

export function AdminModerationSettings({ initialSettings, onSettingsChange }: AdminModerationSettingsProps) {
    const { toast } = useToast();
    const [isSaving, startSaving] = useTransition();
    const [isToggling, startToggling] = useTransition();

    const form = useForm<ModerationFormValues>({
        resolver: zodResolver(moderationSettingsSchema),
        defaultValues: {
            cooldownEnabled: initialSettings.cooldownEnabled,
            cooldownValue: initialSettings.cooldownValue,
            cooldownUnit: initialSettings.cooldownUnit,
            groupsPerPage: initialSettings.groupsPerPage,
        },
    });

    const handleShowClicksChange = (checked: boolean) => {
        startToggling(async () => {
            const result = await toggleShowClicks(checked);
            if (result.success) {
                onSettingsChange({ ...initialSettings, showClicks: checked });
            }
            toast({
                title: result.success ? 'Success' : 'Error',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
        });
    };

    const onSubmit = (data: ModerationFormValues) => {
        startSaving(async () => {
            const formData = new FormData();
            formData.append('cooldownEnabled', data.cooldownEnabled ? 'on' : 'off');
            formData.append('cooldownValue', String(data.cooldownValue));
            formData.append('cooldownUnit', data.cooldownUnit);
            formData.append('groupsPerPage', String(data.groupsPerPage));
            
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
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage global settings for your directory.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Display Settings Column */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Display Settings</h4>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="show-clicks-toggle" className="text-base">Show Click Counts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display join link click counts publicly.
                                    </p>
                                </div>
                                <Switch
                                    id="show-clicks-toggle"
                                    checked={initialSettings.showClicks}
                                    onCheckedChange={handleShowClicksChange}
                                    disabled={isToggling}
                                />
                            </div>
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
                        </div>

                        {/* Moderation Settings Column */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Moderation Settings</h4>
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
                        </div>

                        {/* Submit Button */}
                        <div className="md:col-span-2 flex justify-end">
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
