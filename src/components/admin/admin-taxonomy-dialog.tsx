
'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import type { Category, Country } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { saveTaxonomyItem } from '@/app/admin/actions';
import { Loader2 } from 'lucide-react';

type AdminTaxonomyDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  type: 'category' | 'country';
  itemToEdit: Category | Country | null;
  onSave: (type: 'category' | 'country', item: Category | Country) => void;
};

const formSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters.'),
  value: z.string().min(2, 'Value must be at least 2 characters. Use lowercase and hyphens (e.g., "my-value").').regex(/^[a-z0-9-]+$/, 'Value can only contain lowercase letters, numbers, and hyphens.'),
});

type FormValues = z.infer<typeof formSchema>;

export function AdminTaxonomyDialog({ isOpen, onOpenChange, type, itemToEdit, onSave }: AdminTaxonomyDialogProps) {
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const isEditMode = !!itemToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      value: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            label: itemToEdit?.label || '',
            value: itemToEdit?.value || '',
        });
    }
  }, [isOpen, itemToEdit, form]);

  const onSubmit = (data: FormValues) => {
    startSaving(async () => {
        const formData = new FormData();
        formData.append('label', data.label);
        formData.append('value', data.value);

        const result = await saveTaxonomyItem(type, isEditMode, formData);

        if (result.success) {
            toast({ title: 'Success', description: result.message });
            onSave(type, { id: data.value, ...data });
            onOpenChange(false);
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    });
  };

  const typeName = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? `Edit ${typeName}` : `Add New ${typeName}`}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update the details for this ${type}.` : `Create a new ${type} for your directory.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Art & Design" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., art-design" {...field} disabled={isEditMode} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Save Changes' : 'Create'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
