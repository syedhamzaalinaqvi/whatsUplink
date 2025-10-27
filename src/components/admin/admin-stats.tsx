
'use client';

import type { GroupLink } from '@/lib/data';
import { BarChart, Folder, Globe, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type AdminStatsProps = {
  groups: GroupLink[];
};

export function AdminStats({ groups }: AdminStatsProps) {
  const totalGroups = groups.length;
  const totalCategories = new Set(groups.map(g => g.category)).size;
  const totalCountries = new Set(groups.map(g => g.country)).size;
  const totalFeatured = groups.filter(g => g.featured).length;
  const totalClicks = groups.reduce((acc, group) => acc + (group.clicks || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGroups}</div>
          <p className="text-xs text-muted-foreground">All groups in the directory</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Total join link clicks</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCategories}</div>
          <p className="text-xs text-muted-foreground">Unique categories represented</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Countries</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCountries}</div>
          <p className="text-xs text-muted-foreground">Unique countries represented</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Featured Groups</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFeatured}</div>
          <p className="text-xs text-muted-foreground">Groups marked as featured</p>
        </CardContent>
      </Card>
    </div>
  );
}
