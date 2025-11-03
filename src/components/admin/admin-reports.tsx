
'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Trash, Edit, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { deleteReport } from '@/app/admin/actions';
import type { Report } from '@/lib/data';

type AdminReportsProps = {
  reports: Report[];
  onReportDeleted: (reportId: string) => void;
};

export function AdminReports({ reports, onReportDeleted }: AdminReportsProps) {
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
  };

  const confirmDelete = () => {
    if (!reportToDelete) return;
    
    startDeleteTransition(async () => {
        const result = await deleteReport(reportToDelete.id);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            onReportDeleted(reportToDelete.id);
            setReportToDelete(null);
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>User Reports</CardTitle>
        <CardDescription>
          Review and manage user-submitted reports for groups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Title</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reported On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No reports found. All clear!
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.groupTitle}</TableCell>
                    <TableCell>
                      {report.reason.startsWith('Other:') ? (
                        <span className="text-sm">{report.reason}</span>
                      ) : (
                        <Badge variant="destructive">{report.reason}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/group/invite/${report.groupId}`} target="_blank">
                                <Edit className="mr-2 h-4 w-4" /> View Group
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(report)} className="text-destructive">
                             <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to resolve this report?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the report for <span className="font-bold">&quot;{reportToDelete?.groupTitle}&quot;</span>.
                    This action does not delete the group itself.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isDeleting ? 'Resolving...' : 'Yes, Resolve Report'}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </Card>
  );
}
