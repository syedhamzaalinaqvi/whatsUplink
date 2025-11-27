
'use client';

import { LayoutGrid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GROUP_TYPES } from '@/lib/constants';
import type { Category, Country } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

type GroupListControlsProps = {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  selectedType: 'all' | 'group' | 'channel';
  onTypeChange: (type: 'all' | 'group' | 'channel') => void;
  categories: Category[];
  countries: Country[];
  isLoadingFilters: boolean;
};

export function GroupListControls({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCountry,
  onCountryChange,
  selectedType,
  onTypeChange,
  categories,
  countries,
  isLoadingFilters
}: GroupListControlsProps) {
  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search groups by keyword..."
          className="w-full rounded-full bg-card py-5 pl-10 shadow-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 flex-1 gap-4">
            {isLoadingFilters ? (
                <>
                    <Skeleton className="h-10 w-full rounded-full" />
                    <Skeleton className="h-10 w-full rounded-full" />
                </>
            ) : (
                <>
                    <Select value={selectedCountry} onValueChange={onCountryChange} disabled={isLoadingFilters}>
                        <SelectTrigger className="w-full rounded-full bg-card shadow-sm">
                            <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries.map(country => (
                                <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={onCategoryChange} disabled={isLoadingFilters}>
                        <SelectTrigger className="w-full rounded-full bg-card shadow-sm">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
            )}
            <Select value={selectedType} onValueChange={(v) => onTypeChange(v as any)}>
                <SelectTrigger className="w-full rounded-full bg-card shadow-sm">
                    <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                    {GROUP_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-end gap-2">
           <div className="md:hidden">
             {/* This button is now only for mobile, and is replaced by the floating button */}
           </div>
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
    </div>
  );
}
