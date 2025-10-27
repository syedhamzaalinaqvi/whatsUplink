'use client';

import { LayoutGrid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';

type GroupListControlsProps = {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  submitButton: React.ReactNode;
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
  submitButton,
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
        <div className="flex flex-1 gap-4">
            <Select value={selectedCountry} onValueChange={onCountryChange}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-card shadow-sm">
                    <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                    {COUNTRIES.map(country => (
                        <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-card shadow-sm">
                    <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center justify-end gap-2">
           <div className="hidden md:block">
             {submitButton}
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
