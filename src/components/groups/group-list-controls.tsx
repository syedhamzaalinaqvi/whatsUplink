'use client';

import { LayoutGrid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type GroupListControlsProps = {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function GroupListControls({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
}: GroupListControlsProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search groups by keyword or category..."
          className="w-full rounded-full bg-card py-5 pl-10 shadow-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <ToggleGroup 
          type="single" 
          value={view} 
          onValueChange={(value: 'grid' | 'list') => value && onViewChange(value)}
          aria-label="View mode"
        >
          <ToggleGroupItem value="grid" aria-label="Grid View">
            <LayoutGrid className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List View">
            <List className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
