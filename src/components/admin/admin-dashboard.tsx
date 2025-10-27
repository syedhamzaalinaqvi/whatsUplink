
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { GroupLink } from '@/lib/data';
import { mapDocToGroupLink } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '../layout/header';
import { MoreVertical, Search, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { AdminDeleteDialog } from './admin-delete-dialog';
import { AdminEditDialog } from './admin-edit-dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { COUNTRIES, CATEGORIES } from '@/lib/constants';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { toggleFeaturedStatus, deleteMultipleGroups } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { AdminStats } from './admin-stats';
import { AdminBulkDeleteDialog } from './admin-bulk-delete-dialog';

export function AdminDashboard() {
  const { firestore } = useFirestore();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, startUpdateTransition] = useTransition();

  // Filtering and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Dialogs state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupLink | null>(null);

  useEffect(() => {
    if (!firestore) return;

    setIsLoading(true);
    const groupsCollection = collection(firestore, 'groups');
    const q = query(groupsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(mapDocToGroupLink);
      setGroups(groupsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching groups:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleEdit = (group: GroupLink) => {
    setSelectedGroup(group);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (group: GroupLink) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedGroup(null);
    setIsEditDialogOpen(true);
  };
  
  const handleToggleFeatured = (group: GroupLink) => {
    startUpdateTransition(async () => {
      const result = await toggleFeaturedStatus(group.id, group.featured);
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    });
  };

  const handleSelectRow = (groupId: string) => {
    setSelectedRows(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredGroups.map(g => g.id));
    } else {
      setSelectedRows([]);
    }
  };
  
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || group.title.toLowerCase().includes(searchLower);
      const countryMatch = selectedCountry === 'all' || group.country === selectedCountry;
      const categoryMatch = selectedCategory === 'all' || group.category.toLowerCase() === selectedCategory.toLowerCase();
      return searchMatch && countryMatch && categoryMatch;
    });
  }, [groups, searchQuery, selectedCountry, selectedCategory]);

  const isAllSelected = filteredGroups.length > 0 && selectedRows.length === filteredGroups.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleAddNew}>Add New Group</Button>
        </div>

        <AdminStats groups={groups} />

        <div className="mb-6 mt-6 p-4 border rounded-lg bg-background">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative sm:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                />
            </div>
             <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by Country" />
                </SelectTrigger>
                <SelectContent>
                    {COUNTRIES.map(country => (
                        <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedRows.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{selectedRows.length} group(s) selected</p>
            <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id} data-state={selectedRows.includes(group.id) && 'selected'}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRows.includes(group.id)}
                        onCheckedChange={() => handleSelectRow(group.id)}
                        aria-label={`Select row ${group.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{group.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{group.country}</Badge>
                    </TableCell>
                    <TableCell>
                       <Switch
                        checked={group.featured}
                        onCheckedChange={() => handleToggleFeatured(group)}
                        disabled={isUpdating}
                        aria-label="Toggle featured status"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(group)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(group)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredGroups.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
                <p>No groups found for the selected filters.</p>
            </div>
        )}
      </main>

      {selectedGroup && isDeleteDialogOpen && (
        <AdminDeleteDialog
          group={selectedGroup}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      )}
      
      {isEditDialogOpen && (
         <AdminEditDialog
            group={selectedGroup}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
      )}

      {isBulkDeleteDialogOpen && (
        <AdminBulkDeleteDialog
            groupIds={selectedRows}
            isOpen={isBulkDeleteDialogOpen}
            onOpenChange={setIsBulkDeleteDialogOpen}
            onSuccess={() => setSelectedRows([])}
        />
      )}
    </div>
  );
}
