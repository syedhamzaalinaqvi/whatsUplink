
'use client';
import { useState, useTransition } from 'react';
import type { Category, Country } from '@/lib/data';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { MoreVertical, PlusCircle, Trash, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AdminTaxonomyDialog } from './admin-taxonomy-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteTaxonomyItem } from '@/app/admin/actions';
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

type AdminTaxonomyManagerProps = {
    initialCategories: Category[];
    initialCountries: Country[];
    onUpdateCategories: (categories: Category[]) => void;
    onUpdateCountries: (countries: Country[]) => void;
};

type DialogState = {
    isOpen: boolean;
    type: 'category' | 'country';
    itemToEdit: Category | Country | null;
}

type DeleteDialogState = {
    isOpen: boolean;
    type: 'category' | 'country';
    itemToDelete: Category | Country | null;
}

export function AdminTaxonomyManager({
    initialCategories,
    initialCountries,
    onUpdateCategories,
    onUpdateCountries
}: AdminTaxonomyManagerProps) {
    const { toast } = useToast();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [dialogState, setDialogState] = useState<DialogState>({ isOpen: false, type: 'category', itemToEdit: null });
    const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({ isOpen: false, type: 'category', itemToDelete: null });

    const handleAddNew = (type: 'category' | 'country') => {
        setDialogState({ isOpen: true, type, itemToEdit: null });
    };

    const handleEdit = (type: 'category' | 'country', item: Category | Country) => {
        setDialogState({ isOpen: true, type, itemToEdit: item });
    };
    
    const handleDelete = (type: 'category' | 'country', item: Category | Country) => {
         setDeleteDialogState({ isOpen: true, type, itemToDelete: item });
    };

    const confirmDelete = () => {
        if (!deleteDialogState.itemToDelete) return;
        
        startDeleteTransition(async () => {
            const { type, itemToDelete } = deleteDialogState;
            const result = await deleteTaxonomyItem(type, itemToDelete.value);

            if (result.success) {
                toast({ title: 'Success', description: result.message });
                if (type === 'category') {
                    onUpdateCategories(initialCategories.filter(c => c.id !== itemToDelete.id));
                } else {
                    onUpdateCountries(initialCountries.filter(c => c.id !== itemToDelete.id));
                }
                setDeleteDialogState({ isOpen: false, type: 'category', itemToDelete: null });
            } else {
                toast({ title: 'Error', description: result.message, variant: 'destructive' });
            }
        });
    };

    const handleSave = (type: 'category' | 'country', item: Category | Country) => {
        if (type === 'category') {
            const exists = initialCategories.some(c => c.id === item.id);
            if (exists) {
                onUpdateCategories(initialCategories.map(c => c.id === item.id ? item as Category : c));
            } else {
                onUpdateCategories([...initialCategories, item as Category]);
            }
        } else {
            const exists = initialCountries.some(c => c.id === item.id);
            if (exists) {
                onUpdateCountries(initialCountries.map(c => c.id === item.id ? item as Country : c));
            } else {
                onUpdateCountries([...initialCountries, item as Country]);
            }
        }
    }

    const renderTable = (type: 'category' | 'country', data: (Category | Country)[]) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold">{type === 'category' ? 'Categories' : 'Countries'}</h4>
                <Button variant="outline" size="sm" onClick={() => handleAddNew(type)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New
                </Button>
            </div>
             <div className="rounded-md border max-h-64 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Label</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.label}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{item.value}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(type, item)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(type, item)} className="text-destructive">
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Taxonomy</CardTitle>
                <CardDescription>Manage group categories and countries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {renderTable('category', initialCategories)}
                {renderTable('country', initialCountries)}
            </CardContent>

            <AdminTaxonomyDialog
                isOpen={dialogState.isOpen}
                onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isOpen }))}
                type={dialogState.type}
                itemToEdit={dialogState.itemToEdit}
                onSave={handleSave}
            />

            <AlertDialog open={deleteDialogState.isOpen} onOpenChange={(isOpen) => setDeleteDialogState(prev => ({...prev, isOpen}))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the {deleteDialogState.type}
                        <span className="font-bold"> &quot;{deleteDialogState.itemToDelete?.label}&quot;</span>.
                        Groups using this {deleteDialogState.type} will not be affected but it will no longer be available in filters or forms.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
