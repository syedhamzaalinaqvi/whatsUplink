
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reportGroup } from '@/app/actions';
import type { GroupLink } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const REPORT_REASONS = [
  'Broken Link',
  'Spam or Advertisement',
  'Inappropriate Content',
  'Different from Description',
  'Other',
];

const reportSchema = z.object({
  reason: z.string({ required_error: 'Please select a reason.' }),
  otherReason: z.string().optional(),
}).refine(data => {
    // If reason is 'Other', then otherReason must have content.
    if (data.reason === 'Other' && (!data.otherReason || data.otherReason.trim().length < 10)) {
        return false;
    }
    return true;
}, {
    message: "Please provide a detailed reason (at least 10 characters).",
    path: ["otherReason"], // This specifies which field the error message is associated with.
});


type ReportFormValues = z.infer<typeof reportSchema>;

type GroupReportDialogProps = {
  group: GroupLink;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function GroupReportDialog({ group, isOpen, onOpenChange }: GroupReportDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startSubmitting] = useTransition();
  const form = useForm<ReportFormValues>({ 
    resolver: zodResolver(reportSchema),
    defaultValues: {
        reason: '',
        otherReason: '',
    }
  });

  const selectedReason = form.watch('reason');

  const onSubmit = (data: ReportFormValues) => {
    startSubmitting(async () => {
      const formData = new FormData();
      formData.append('groupId', group.id);
      formData.append('groupTitle', group.title);
      formData.append('reason', data.reason);
      if (data.reason === 'Other' && data.otherReason) {
        formData.append('otherReason', data.otherReason);
      }

      const result = await reportGroup(formData);
      
      toast({
        title: result.success ? 'Report Submitted' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      
      if (result.success) {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report &quot;{group.title}&quot;</DialogTitle>
          <DialogDescription>
            Help us maintain a quality directory. Select a reason for reporting this group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="report-form" className="py-4 space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Reason for reporting:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {REPORT_REASONS.map((reason) => (
                        <FormItem key={reason} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={reason} />
                          </FormControl>
                          <FormLabel className="font-normal">{reason}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedReason === 'Other' && (
              <FormField
                control={form.control}
                name="otherReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please provide more details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us more about the issue..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="report-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
