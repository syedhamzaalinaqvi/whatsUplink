'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { MoreVertical, Search, Trash2, Star, ChevronLeft, ChevronRight, Eye, Repeat } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { AdminDeleteDialog } from './admin-delete-dialog';
import { AdminEditDialog } from './admin-edit-dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GROUP_TYPES } from '@/lib/constants';
import { Checkbox } from '../ui/checkbox';
import { toggleFeaturedStatus, bulkSetFeaturedStatus } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { AdminStats } from './admin-stats';
import { AdminBulkDeleteDialog } from './admin-bulk-delete-dialog';
import { AdminModerationSettings } from './admin-moderation-settings';
import { Switch } from '../ui/switch';
import { AdminTaxonomyManager } from './admin-taxonomy-manager';
import { AdminLayoutSettings } from './admin-layout-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AdminReports } from './admin-reports';
import { useFirestore } from '@/firebase/provider';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { mapDocToGroupLink, mapDocToReport } from '@/lib/data';


const ROWS_PER_PAGE_OPTIONS = [50, 100, 200, 500];

type AdminDashboardProps = {
  initialGroups: GroupLink[];
  initialHasNextPage: boolean;
  initialHasPrevPage: boolean;
  initialModerationSettings: ModerationSettings;
  initialCategories: Category[];
  initialCountries: Country[];
  initialLayoutSettings: LayoutSettings;
  initialReports: Report[];
};

export function AdminDashboard({
  initialGroups,
  initialHasNextPage,
  initialHasPrevPage,
  initialModerationSettings,
  initialCategories,
  initialCountries,
  initialLayoutSettings,
  initialReports,
}: AdminDashboardProps) {
  'use client';
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore } = useFirestore();

  const [groups, setGroups] = useState<GroupLink[]>(initialGroups);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [hasPrevPage, setHasPrevPage] = useState(initialHasPrevPage);
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>(initialModerationSettings);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(initialLayoutSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, startUpdateTransition] = useTransition();

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [countries, setCountries] = useState<Country[]>(initialCountries);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'group' | 'channel'>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const rowsPerPage = searchParams.get('rows') ? parseInt(searchParams.get('rows')!, 10) : 50;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupLink | null>(null);

  useEffect(() => {
    // This effect ensures that if the user navigates (e.g., pagination), the new props are reflected.
    setGroups(initialGroups);
    setReports(initialReports);
    setHasNextPage(initialHasNextPage);
    setHasPrevPage(initialHasPrevPage);
    setIsLoading(false);
  }, [initialGroups, initialReports, initialHasNextPage, initialHasPrevPage]);

  useEffect(() => {
      // These setters are for non-paginated data that can also be updated within the dashboard.
      setModerationSettings(initialModerationSettings);
      setLayoutSettings(initialLayoutSettings);
      setCategories(initialCategories);
      setCountries(initialCountries);
  }, [initialModerationSettings, initialLayoutSettings, initialCategories, initialCountries]);

  useEffect(() => {
    if (!firestore) return;

    // Real-time listener for Reports
    const reportsQuery = query(collection(firestore, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const updatedReports = snapshot.docs.map(mapDocToReport);
      setReports(updatedReports);
    });

    // Real-time listener for Groups
    // This listener will only add new groups to the top of the existing list to avoid pagination conflicts.
    // Full reloads happen on navigation.
    const groupsQuery = query(collection(firestore, 'groups'), orderBy('createdAt', 'desc'), limit(rowsPerPage));
    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
       const serverGroups = snapshot.docs.map(mapDocToGroupLink);
       setGroups(prevGroups => {
         const newGroups = serverGroups.filter(g => !prevGroups.some(pg => pg.id === g.id));
         const updatedGroups = prevGroups.map(pg => {
            const updated = serverGroups.find(sg => sg.id === pg.id);
            return updated || pg;
         });
         return [...newGroups, ...updatedGroups]
            .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
            .slice(0, rowsPerPage);
       });
    });

    return () => {
      unsubscribeReports();
      unsubscribeGroups();
    };
  }, [firestore, rowsPerPage]);


  const navigate = (direction: 'next' | 'prev' | 'first', newRowsPerPage?: number) => {
    setIsLoading(true);
    const currentRows = newRowsPerPage || rowsPerPage;
    const params = new URLSearchParams();
    params.set('rows', String(currentRows));
    params.set('page', direction);

    if (direction === 'next' && groups.length > 0) {
      params.set('cursor', groups[groups.length - 1].id);
    } else if (direction === 'prev' && groups.length > 0) {
      params.set('cursor', groups[0].id);
    }
    
    router.push(`/admin?${params.toString()}`);
  };


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
      if (result.success) {
        setGroups(currentGroups => currentGroups.map(g => g.id === group.id ? { ...g, featured: !g.featured } : g));
      }
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    });
  };

  const handleBulkFeature = (featured: boolean) => {
    startUpdateTransition(async () => {
      const result = await bulkSetFeaturedStatus(selectedRows, featured);
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      if (result.success) {
        setGroups(currentGroups => currentGroups.map(g => selectedRows.includes(g.id) ? { ...g, featured } : g));
        setSelectedRows([]);
      }
    });
  }

  const handleSelectRow = (groupId: string) => {
    setSelectedRows(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };
  
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

        <AdminStats groups={groups} />

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
                        Array.from({ length: rowsPerPage }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-11" /></TableCell>
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
                
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        {selectedRows.length} of {filteredGroups.length} row(s) selected.
                    </div>
                    <div className="flex items-center gap-4">
                        <div className='flex items-center gap-2'>
                            <span className="text-sm">Rows per page:</span>
                            <Select value={`${rowsPerPage}`} onValueChange={(value) => navigate('first', Number(value))}>
                                <SelectTrigger className='w-20'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROWS_PER_PAGE_OPTIONS.map(opt => (
                                        <SelectItem key={opt} value={`${opt}`}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate('prev')}
                                disabled={!hasPrevPage || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate('next')}
                                disabled={!hasNextPage || isLoading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {filteredGroups.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No groups found for the selected filters.</p>
                    </div>
                )}
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
                <AdminReports reports={reports} onReportDeleted={id => setReports(r => r.filter(rep => rep.id !== id))}/>
            </TabsContent>
        </Tabs>
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
            categories={categories}
            countries={countries}
        />
      )}

      {isBulkDeleteDialogOpen && (
        <AdminBulkDeleteDialog
            groupIds={selectedRows}
            isOpen={isBulkDeleteDialogOpen}
            onOpenChange={setIsBulkDeleteDialogOpen}
            onSuccess={() => {
                setGroups(current => current.filter(g => !selectedRows.includes(g.id)));
                setSelectedRows([]);
            }}
        />
      )}
    </div>
  );
}
