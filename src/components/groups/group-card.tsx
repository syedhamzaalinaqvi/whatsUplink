import Image from 'next/image';
import { ExternalLink, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GroupLink } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessagesSquare } from 'lucide-react';

type GroupCardProps = {
  group: GroupLink;
  view: 'grid' | 'list';
  onTagClick: (tag: string) => void;
};

export function GroupCard({ group, view, onTagClick }: GroupCardProps) {
  if (view === 'grid') {
    return (
      <a href={group.link} target="_blank" rel="noopener noreferrer" className="block group">
        <Card className="h-full flex flex-col items-center justify-center p-4 text-center relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs">{group.category}</Badge>
            <Avatar className="h-24 w-24 text-primary border-2 border-primary/20">
                <AvatarImage src={group.imageUrl} alt={`Preview for ${group.title}`} />
                <AvatarFallback>
                    <MessagesSquare className="h-10 w-10"/>
                </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-sm line-clamp-2 mt-3">{group.title}</h3>
            <Badge variant="outline" className="absolute bottom-2 right-2 text-xs capitalize">{group.country}</Badge>
        </Card>
      </a>
    );
  }

  // List View
  return (
    <Card className="transition-all duration-300 hover:shadow-xl overflow-hidden flex flex-col sm:flex-row">
      <div className="p-4 sm:p-6 flex items-center sm:border-r">
          <Avatar className="h-16 w-16 text-primary">
            <AvatarImage src={group.imageUrl} alt={`Preview for ${group.title}`} />
            <AvatarFallback>
              <MessagesSquare className="h-8 w-8"/>
            </AvatarFallback>
          </Avatar>
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <CardHeader className="pt-0 sm:pt-6">
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
