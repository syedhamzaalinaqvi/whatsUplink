'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Tag, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GroupLink } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessagesSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type GroupCardProps = {
  group: GroupLink;
  view: 'grid' | 'list';
  onTagClick: (tag: string) => void;
};

export function GroupCard({ group, view, onTagClick }: GroupCardProps) {
  const { toast } = useToast();
  const timeAgo = group.createdAt ? formatDistanceToNow(new Date(group.createdAt), { addSuffix: true }) : 'recently';
  const detailUrl = `${window.location.origin}/group/invite/${group.id}`;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: group.title,
      text: `Check out this WhatsApp group: ${group.title}`,
      url: detailUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      try {
        await navigator.clipboard.writeText(detailUrl);
        toast({
          title: 'Link Copied!',
          description: 'Group link copied to your clipboard.',
        });
      } catch (error) {
        console.error('Error copying link:', error);
        toast({
          title: 'Error',
          description: 'Could not copy link to clipboard.',
          variant: 'destructive',
        });
      }
    }
  };

  if (view === 'grid') {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-4 text-center relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-muted/30 group">
        <Link href={`/group/invite/${group.id}`} className="block absolute inset-0 z-0" />
        <Badge className="absolute top-2 left-2 text-xs capitalize bg-primary text-primary-foreground hover:bg-primary/80 z-10">{group.country}</Badge>
        <Badge className="absolute top-2 right-2 text-xs bg-accent text-accent-foreground hover:bg-accent/80 z-10">{group.category}</Badge>
        <Avatar className="h-24 w-24 text-primary border-2 border-primary/20">
            <AvatarImage src={group.imageUrl} alt={`Preview for ${group.title}`} />
            <AvatarFallback>
                <MessagesSquare className="h-10 w-10"/>
            </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-sm line-clamp-2 mt-3">{group.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {timeAgo}
        </p>
        <Button onClick={handleShare} variant="ghost" size="icon" className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
        </Button>
      </Card>
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
        <CardFooter className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Submitted {timeAgo}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={handleShare} variant="outline" size="icon" className="h-10 w-10">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
            </Button>
            <Button asChild className="w-full" variant="secondary">
                <Link href={`/group/invite/${group.id}`}>
                View Details
                <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
