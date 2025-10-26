import Image from 'next/image';
import { ExternalLink, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GroupLink } from '@/lib/data';

type GroupCardProps = {
  group: GroupLink;
  view: 'grid' | 'list';
  onTagClick: (tag: string) => void;
};

export function GroupCard({ group, view, onTagClick }: GroupCardProps) {
  if (view === 'grid') {
    return (
      <a href={group.link} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden relative group border shadow-sm hover:shadow-xl transition-shadow duration-300">
        <Card className="h-full">
            <div className="relative aspect-[3/4] w-full">
                <Image
                    src={group.imageUrl}
                    alt={`Preview for ${group.title}`}
                    fill
                    data-ai-hint={group.imageHint}
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-bold text-sm line-clamp-2">{group.title}</h3>
                    <div className="flex justify-between items-center text-xs opacity-80 mt-1">
                        <span>{group.category}</span>
                        <span className="capitalize">{group.country}</span>
                    </div>
                </div>
            </div>
        </Card>
      </a>
    );
  }

  // List View
  return (
    <Card className="transition-all duration-300 hover:shadow-xl overflow-hidden flex flex-col sm:flex-row">
      <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0">
        <Image
          src={group.imageUrl}
          alt={`Preview for ${group.title}`}
          fill
          data-ai-hint={group.imageHint}
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg font-semibold">{group.title}</CardTitle>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Badge variant="secondary" className="whitespace-nowrap">{group.category}</Badge>
                <Badge variant="outline" className="whitespace-nowrap capitalize">{group.country}</Badge>
            </div>
          </div>
          <CardDescription className="pt-2 line-clamp-3">{group.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {group.tags.map(tag => (
                    <button key={tag} onClick={() => onTagClick(tag)} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                        <Badge variant="default" className="cursor-pointer bg-primary hover:bg-primary/80">{tag}</Badge>
                    </button>
                ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="secondary">
            <a href={group.link} target="_blank" rel="noopener noreferrer">
              Join Group
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
