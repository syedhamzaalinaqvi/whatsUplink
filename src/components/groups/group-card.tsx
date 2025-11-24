
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Tag, Share2, Users, Clock, RadioTower, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GroupLink } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { MessagesSquare } from 'lucide-react';
import { SharePopover } from './share-popover';
import NProgress from 'nprogress';
import { StarRating } from './star-rating';

type GroupCardProps = {
  group: GroupLink;
  view: 'grid' | 'list';
  onTagClick: (tag: string) => void;
  showClicks: boolean;
  showRatings: boolean;
};

export function GroupCard({ group, view, onTagClick, showClicks, showRatings }: GroupCardProps) {
  const router = useRouter();
  
  // Use the last submitted date if available, otherwise use creation date
  const relevantDate = group.lastSubmittedAt || group.createdAt;
  const timeAgo = relevantDate
    ? formatDistanceToNow(new Date(relevantDate), { addSuffix: true }).replace('about ', '')
    : 'recently';
  
  const typeIcon = group.type === 'channel' 
    ? <RadioTower className="h-3 w-3" /> 
    : <Users className="h-3 w-3" />;

  const detailUrl = `/group/invite/${group.id}`;

  const handlePrefetch = () => {
    router.prefetch(detailUrl);
  };
  
  const handleCardClick = () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    NProgress.start();
  };

  const handleLocalTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    e.preventDefault();
    onTagClick(tag);
  }
  
  const averageRating = (group.ratingCount ?? 0) > 0 ? (group.totalRating ?? 0) / (group.ratingCount ?? 0) : 0;

  if (view === 'grid') {
    return (
      <Card 
        className="h-full flex flex-col items-center justify-center p-4 text-center relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card group"
        onMouseEnter={handlePrefetch}
      >
        <Link href={detailUrl} className="block absolute inset-0 z-0" onClick={handleCardClick} />
        <Badge className="absolute top-2 left-2 text-xs capitalize bg-primary text-primary-foreground hover:bg-primary/80 z-10">{group.country}</Badge>
        <Badge className="absolute top-2 right-2 text-xs bg-accent text-accent-foreground hover:bg-accent/80 z-10">{group.category}</Badge>
        <Avatar className="h-24 w-24 text-primary border-2 border-primary/20">
            <AvatarImage src={group.imageUrl} alt={`Preview for ${group.title}`} />
            <AvatarFallback>
                <MessagesSquare className="h-10 w-10"/>
            </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-sm line-clamp-2 mt-3">{group.title}</h3>
        
        {showRatings && averageRating > 0 && (
            <div className="mt-2 flex items-center gap-1">
                <StarRating rating={averageRating} size={16} readOnly />
                <span className="text-xs text-muted-foreground ml-1">({group.ratingCount ?? 0})</span>
            </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo}
            </span>
             <Badge 
                variant={group.type === 'channel' ? 'default' : 'secondary'} 
                className="capitalize text-xs px-2 py-0.5"
            >
                {group.type}
            </Badge>
        </div>

        {showClicks && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Eye className="h-3 w-3" />
                <span>{group.clicks ?? 0} views</span>
            </div>
        )}

        <div className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-background/50 transition-opacity">
            <SharePopover title={group.title} url={detailUrl}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                </Button>
            </SharePopover>
        </div>
      </Card>
    );
  }

  // List View
  return (
    <Card 
        className="transition-all duration-300 hover:shadow-xl overflow-hidden flex flex-col sm:flex-row"
        onMouseEnter={handlePrefetch}
    >
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
                {showRatings && averageRating > 0 && (
                    <div className="flex items-center gap-1">
                        <StarRating rating={averageRating} size={16} readOnly />
                        <span className="text-xs text-muted-foreground">({group.ratingCount ?? 0})</span>
                    </div>
                )}
                <Badge variant="secondary" className="whitespace-nowrap">{group.category}</Badge>
            </div>
          </div>
          <CardDescription className="pt-2 line-clamp-3">{group.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {group.tags.map(tag => (
                    <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} onClick={(e) => handleLocalTagClick(e, tag)} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full z-10">
                        <Badge variant="default" className="cursor-pointer bg-primary hover:bg-primary/80">{tag}</Badge>
                    </Link>
                ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Submitted {timeAgo}
            </span>
             <Badge 
                variant={group.type === 'channel' ? 'default' : 'secondary'} 
                className="capitalize text-xs px-2 py-0.5"
            >
                {group.type}
            </Badge>
            {showClicks && (
                <span className="flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    {group.clicks ?? 0}
                </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SharePopover title={group.title} url={detailUrl}>
                <Button variant="outline" size="icon" className="h-10 w-10">
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                </Button>
            </SharePopover>
            <Button asChild className="w-full z-10" variant="secondary" onClick={handleCardClick}>
                <Link href={detailUrl}>
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
