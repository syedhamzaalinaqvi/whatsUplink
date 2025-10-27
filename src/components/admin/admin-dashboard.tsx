
'use client';

import { useEffect, useState } from 'react';
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
import { MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

export function AdminDashboard() {
  const { firestore } = useFirestore();
  const [groups, setGroups] = useState<GroupLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button>Add New Group</Button>
        </div>
        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{group.country}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {groups.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
                <p>No groups found in the database.</p>
            </div>
        )}
      </main>
    </div>
  );
}
