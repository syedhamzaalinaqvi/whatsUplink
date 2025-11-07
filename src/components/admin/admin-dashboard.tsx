
'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import type { Category, Country, GroupLink, LayoutSettings, ModerationSettings, Report } from '@/lib/data';
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
import { MoreVertical, Search, Trash2, Star, Eye, Repeat, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AdminDeleteDialog } from './admin-delete-dialog';
import { AdminEditDialog } from './admin-edit-dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GROUP_TYPES } from '@/lib/constants';
import { Checkbox } from '../ui/checkbox';
import { toggleFeaturedStatus, bulkSetFeaturedStatus, getPaginatedGroups } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { AdminStats } from './admin-stats';
import { AdminBulkDeleteDialog } from './admin-bulk-delete-dialog';
import { AdminModerationSettings } from './admin-moderation-settings';
import { Switch } from '../ui/switch';
import { AdminTaxonomyManager } from './admin-taxonomy-manager';
import { AdminLayoutSettings } from './admin-layout-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AdminReports } from './admin-reports';

type AdminDashboardProps = {
  initialGroups: GroupLink[];
  initialTotalPages: number;
  initialTotalGroups: number;
  initialModerationSettings: ModerationSettings;
  initialCategories: Category[];
  initialCountries: Country[];
  initialLayoutSettings: LayoutSettings;
  initialReports: Report[];
};

export function AdminDashboard({
  initialGroups,
  initialTotalPages,
  initialTotalGroups,
  initialModerationSettings,
  initialCategories,
  initialCountries,
  initialLayoutSettings,
  initialReports,
}: AdminDashboardProps) {
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalGroups, setTotalGroups] = useState(initialTotalGroups);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>(initialModerationSettings);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(initialLayoutSettings);
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isLoading, startLoadingTransition] = useTransition();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [countries, setCountries] = useState<Country[]>(initialCountries);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'group' | 'channel'>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupLink | null>(null);

  const handleFetchPage = (page: number, rpp: number) => {
    startLoadingTransition(async () => {
      const { groups: newGroups, totalPages: newTotalPages, totalGroups: newTotalGroups } = await getPaginatedGroups(page, rpp);
      setGroups(newGroups);
      setTotalPages(newTotalPages);
      setTotalGroups(newTotalGroups);
      setCurrentPage(page);
      setRowsPerPage(rpp);
    });
  };

  useEffect(() => {
    // This effect runs when the component mounts and when pagination/filter options change.
    handleFetchPage(currentPage, rowsPerPage);
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    // Reset to page 1 when filters change to avoid being on an invalid page
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, selectedCountry, selectedCategory, selectedType]);

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
      const result = await toggleFeaturedStatus(group.id, !!group.featured);
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if(result.success) {
        handleFetchPage(currentPage, rowsPerPage);
      }
    });
  };

  const handleBulkFeature = (featured: boolean) => {
    startUpdateTransition(async () => {
      if (selectedRows.length === 0) return;
      const result = await bulkSetFeaturedStatus(selectedRows, featured);
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        setSelectedRows([]);
        handleFetchPage(currentPage, rowsPerPage);
      }
    });
  }

  const handleSelectRow = (groupId: string) => {
    setSelectedRows(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };
  
  // Client-side filtering is now disabled in favor of server-side pagination/filtering
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const searchLower = searchQuery.toLowerCase();
      const searchMatch = !searchQuery || group.title.toLowerCase().includes(searchLower);
      const countryMatch = selectedCountry === 'all' || group.country === selectedCountry;
      const categoryMatch = selectedCategory === 'all' || group.category.toLowerCase() === selectedCategory.toLowerCase();
      const typeMatch = selectedType === 'all' || group.type === selectedType;
      return searchMatch && countryMatch && categoryMatch && typeMatch;
    });
  }, [groups, searchQuery, selectedCountry, selectedCategory, selectedType]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredGroups.map(g => g.id));
    } else {
      setSelectedRows([]);
    }
  };

  const isAllSelected = filteredGroups.length > 0 && selectedRows.length === filteredGroups.length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button onClick={handleAddNew}>Add New Group</Button>
          </div>
        </div>

        <AdminStats groups={initialGroups} />

        <Tabs defaultValue="groups" className="mt-6">
             <TabsList className="h-auto w-full md:w-fit md:h-10 flex flex-col md:inline-flex md:flex-row">
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="settings">Settings & Layout</TabsTrigger>
                <TabsTrigger value="reports">
                    Reports
                    {reports.length > 0 && (
                        <Badge variant="destructive" className="ml-2 rounded-full px-2">
                            {reports.length}
                        </Badge>
                    )}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="groups">
                <div className="mb-6 mt-6 p-4 border rounded-lg bg-background">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative lg:col-span-1">
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
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries.map(country => (
                                <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {GROUP_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                </div>
                
                {selectedRows.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{selectedRows.length} group(s) selected</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleBulkFeature(true)} disabled={isUpdating}>
                            <Star className="mr-2 h-4 w-4" />
                            Mark as Featured
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkFeature(false)} disabled={isUpdating}>
                            <Star className="mr-2 h-4 w-4" />
                            Remove from Featured
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                        </Button>
                    </div>
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
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    ) : filteredGroups.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">
                                No groups found for the selected filters.
                            </TableCell>
                        </TableRow>
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
                            <TableCell className="font-medium">
                                {group.title}
                            </TableCell>
                            <TableCell>
                            <Badge variant={group.type === 'channel' ? 'default' : 'secondary'} className="capitalize">{group.type}</Badge>
                            </TableCell>
                            <TableCell>
                            <Badge variant="outline">{group.category}</Badge>
                            </TableCell>
                            <TableCell>
                            <Badge variant="secondary" className="capitalize">{group.country}</Badge>
                            </TableCell>
                            <TableCell>
                                <div className='flex items-center gap-1.5'>
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-sm">{group.clicks ?? 0}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className='flex items-center gap-1.5'>
                                    <Repeat className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-sm">{group.submissionCount ?? 1}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                            <Switch
                                checked={group.featured}
                                onCheckedChange={() => handleToggleFeatured(group)}
                                disabled={isUpdating}
                                aria-label={`Mark ${group.title} as featured`}
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
                
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {selectedRows.length} of {totalGroups} row(s) selected.
                    </div>
                     <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${rowsPerPage}`}
                            onValueChange={(value) => {
                                setRowsPerPage(Number(value));
                                setCurrentPage(1); // Reset to first page
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={rowsPerPage} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[50, 100, 200, 500].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

            </TabsContent>
            <TabsContent value="settings">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2 space-y-6">
                        <AdminModerationSettings
                            initialSettings={moderationSettings}
                            onSettingsChange={setModerationSettings}
                        />
                         <AdminLayoutSettings initialSettings={layoutSettings} onSettingsChange={setLayoutSettings} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <AdminTaxonomyManager
                            initialCategories={categories}
                            initialCountries={countries}
                            onUpdateCategories={setCategories}
                            onUpdateCountries={setCountries}
                        />
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="reports">
                <AdminReports reports={reports} />
            </TabsContent>
        </Tabs>
      </main>

      {selectedGroup && isDeleteDialogOpen && (
        <AdminDeleteDialog
          group={selectedGroup}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={() => handleFetchPage(currentPage, rowsPerPage)}
        />
      )}
      
      {isEditDialogOpen && (
         <AdminEditDialog
            group={selectedGroup}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            categories={categories}
            countries={countries}
            onSuccess={() => handleFetchPage(currentPage, rowsPerPage)}
        />
      )}

      {isBulkDeleteDialogOpen && (
        <AdminBulkDeleteDialog
            groupIds={selectedRows}
            isOpen={isBulkDeleteDialogOpen}
            onOpenChange={setIsBulkDeleteDialogOpen}
            onSuccess={() => {
                setSelectedRows([]);
                handleFetchPage(currentPage, rowsPerPage);
            }}
        />
      )}
    </div>
  );
}

    