
'use client';

import { useTransition } from 'react';
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
import { useCallback } from 'react';

const moderationSettingsSchema = z.object({
    cooldownEnabled: z.boolean(),
    cooldownValue: z.coerce.number().min(1, 'Must be at least 1'),
    cooldownUnit: z.enum(['hours', 'days', 'months']),
});

type ModerationFormValues = z.infer<typeof moderationSettingsSchema>;

type AdminModerationSettingsProps = {
    initialSettings: ModerationSettings;
    showClicks: boolean;
    onShowClicksChange: (show: boolean) => void;
    isUpdating: boolean;
};

export function AdminModerationSettings({ initialSettings, showClicks, onShowClicksChange, isUpdating }: AdminModerationSettingsProps) {
    const { toast } = useToast();
    const [isSaving, startSaving] = useTransition();

    const handleShowClicksChange = useCallback(async (checked: boolean) => {
        try {
            const result = await toggleShowClicks(checked);
            if (result.success) {
                onShowClicksChange(checked);
            }
            toast({
                title: result.success ? 'Success' : 'Error',
                description: result.message,
                variant: result.success ? 'default' : 'destructive',
            });
        } catch (error) {
            console.error('Error updating view count visibility:', error);
            toast({
                title: 'Error',
                description: 'Failed to update view count visibility.',
                variant: 'destructive',
            });
        }
    }, [onShowClicksChange, toast]);

    const form = useForm<ModerationFormValues>({
        resolver: zodResolver(moderationSettingsSchema),
        defaultValues: {
            cooldownEnabled: initialSettings.cooldownEnabled,
            cooldownValue: initialSettings.cooldownValue,
            cooldownUnit: initialSettings.cooldownUnit,
        },
    });

    const onSubmit = (data: ModerationFormValues) => {
        startSaving(async () => {
            const formData = new FormData();
            formData.append('cooldownEnabled', data.cooldownEnabled ? 'on' : 'off');
            formData.append('cooldownValue', String(data.cooldownValue));
            formData.append('cooldownUnit', data.cooldownUnit);
            
            const result = await saveModerationSettings(formData);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Display Settings</h4>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="show-clicks-toggle" className="text-base">Show Click Counts</Label>
                                <p className="text-sm text-muted-foreground">
                                    Display the join link click count on group cards for all users.
                                </p>
                            </div>
                            <Switch
                                id="show-clicks-toggle"
                                checked={showClicks}
                                onCheckedChange={handleShowClicksChange}
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Moderation Settings</h4>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border p-4">
                                <FormField
                                    control={form.control}
                                    name="cooldownEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Enable Resubmission Cooldown</FormLabel>
                                                <p className="text-sm text-muted-foreground">
                                                    Prevent spam by limiting how often the same link can be submitted.
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
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Moderation Settings
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
