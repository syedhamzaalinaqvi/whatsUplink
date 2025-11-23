
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  MegaphoneOff,
  Eye,
  Info,
  Users,
  Share2,
  RadioTower,
  Flag,
  Tag,
  Repeat,
  Star
} from 'lucide-react';
import type { GroupLink, Category, Country, ModerationSettings } from '@/lib/data';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupCard } from '@/components/groups/group-card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SharePopover } from './share-popover';
import { useEffect, useState, useTransition } from 'react';
import { useFirestore } from '@/firebase/provider';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { GroupReportDialog } from './group-report-dialog';
import { StarRating } from './star-rating';
import { submitRating } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { getModerationSettings } from '@/lib/admin-settings';

type GroupDetailViewProps = {
  group: GroupLink;
  relatedGroups: GroupLink[];
  categories: Category[];
  countries: Country[];
};

export function GroupDetailView({ group: initialGroup, relatedGroups, categories, countries }: GroupDetailViewProps) {
  const [group, setGroup] = useState(initialGroup);
  const [detailUrl, setDetailUrl] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [settings, setSettings] = useState<ModerationSettings | null>(null);
  const { firestore } = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isRating, startRatingTransition] = useTransition();

  useEffect(() => {
    // Ensure this runs only on the client
    setDetailUrl(window.location.href);
    
    // Fetch moderation settings on the client
    async function fetchSettings() {
        const fetchedSettings = await getModerationSettings();
        setSettings(fetchedSettings);
    }
    fetchSettings();
  }, []);
  
  useEffect(() => {
    setGroup(initialGroup);
  }, [initialGroup]);

  const handleJoinClick = () => {
    if (firestore && group.id) {
      const groupRef = doc(firestore, 'groups', group.id);
      updateDoc(groupRef, {
        clicks: increment(1),
      }).catch(err => console.error("Failed to increment click count", err));
    }
  };
  
  const handleTagClick = (tag: string) => {
    router.push(`/tag/${encodeURIComponent(tag)}`);
  };

  const handleRatingSubmit = (rating: number) => {
    startRatingTransition(async () => {
      const formData = new FormData();
      formData.append('groupId', group.id);
      formData.append('rating', String(rating));
      
      const result = await submitRating(formData);

      toast({
        title: result.success ? 'Rating Submitted!' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
      
      if (result.success && result.newAverage !== undefined) {
        setGroup(prev => ({
            ...prev,
            totalRating: (prev.totalRating ?? 0) + rating,
            ratingCount: (prev.ratingCount ?? 0) + 1,
        }));
      }
    });
  };

  const rules = [
    {
      icon: ShieldCheck,
      title: 'Be Respectful',
      description:
        'Treat all members with respect. Harassment, hate speech, and bullying are not tolerated.',
    },
    {
      icon: MegaphoneOff,
      title: 'No Spam',
      description:
        'Avoid posting unsolicited advertisements or spamming the group with irrelevant messages.',
    },
    {
      icon: Eye,
      title: 'Mind Your Privacy',
      description:
        'Your phone number will be visible to all members. Do not share sensitive personal information.',
    },
    {
      icon: Users,
      title: 'Follow Admin Rules',
      description:
        'The group admin may have additional specific rules. Please read and adhere to them upon joining.',
    },
  ];
  
  const typeIcon = group.type === 'channel' ? <RadioTower className="h-4 w-4" /> : <Users className="h-4 w-4" />;

  const categoryLabel = categories.find(c => c.value === group.category)?.label || group.category;
  const countryLabel = countries.find(c => c.value === group.country)?.label || group.country;

  const averageRating = (group.ratingCount ?? 0) > 0 ? (group.totalRating ?? 0) / (group.ratingCount ?? 0) : 0;
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Join ${group.title} - WhatsApp Group Link`,
    description: group.description,
    url: detailUrl,
    image: group.imageUrl,
    mainEntity: {
      '@type': 'SocialMediaPosting',
      headline: `WhatsApp Group Link for ${group.title}`,
      text: group.description,
      sharedContent: {
        '@type': 'WebPage',
        headline: `Join ${group.title} on WhatsApp`,
        url: group.link,
      },
      author: {
        '@type': 'Organization',
        name: 'WhatsUpLink',
      },
      // Use lastSubmittedAt for more accurate date, fallback to createdAt
      datePublished: group.lastSubmittedAt || group.createdAt,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating.toFixed(1),
        ratingCount: group.ratingCount ?? 0,
      },
    },
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex-1">
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="container py-8 md:py-12">
          <div className="mb-8">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Group Links
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48 sm:h-64">
                    <Image
                      src={group.imageUrl}
                      alt={`Banner for ${group.title} WhatsApp group`}
                      fill
                      className="object-cover"
                      data-ai-hint={group.imageHint}
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {group.title} WhatsApp Group
                      </h1>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Badge variant="secondary">{categoryLabel}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {countryLabel}
                    </Badge>
                     <Badge 
                        variant={group.type === 'channel' ? 'default' : 'secondary'} 
                        className="capitalize text-sm px-3 py-1"
                    >
                        <div className='flex items-center gap-2'>
                            {typeIcon}
                            <span>{group.type}</span>
                        </div>
                    </Badge>
                     {(group.submissionCount ?? 1) > 1 && (
                        <Badge variant="destructive" className="text-sm px-3 py-1">
                            <div className='flex items-center gap-2'>
                                <Repeat className="h-4 w-4" />
                                <span>Re-submitted</span>
                            </div>
                        </Badge>
                     )}
                    {group.showClicks && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>{group.clicks ?? 0} views</span>
                        </div>
                    )}
                  </div>

                  {settings?.showRatings && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 my-4 rounded-lg border p-4 bg-muted/50">
                        <div className='flex-shrink-0'>
                            <h4 className="font-semibold text-center sm:text-left">Rate this group</h4>
                             <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                                <Star className="h-5 w-5 text-yellow-400" />
                                <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">({group.ratingCount ?? 0} ratings)</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full flex items-center justify-center">
                           <StarRating 
                                rating={averageRating} 
                                onRating={handleRatingSubmit}
                                size={32}
                                disabled={isRating}
                            />
                        </div>
                    </div>
                  )}

                  <p className="text-base text-foreground/80 whitespace-pre-wrap mt-6">
                    {group.description}
                  </p>
                  
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center mt-6">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {group.tags.map(tag => (
                            <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} onClick={() => handleTagClick(tag)} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                                <Badge variant="default" className="cursor-pointer bg-primary/90 hover:bg-primary/80">{tag}</Badge>
                            </Link>
                        ))}
                    </div>
                  )}

                </CardContent>
                <CardFooter className="flex-wrap gap-2">
                  <Button asChild className="w-full text-lg py-6 flex-1 sm:w-auto">
                    <a
                      href={group.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleJoinClick}
                    >
                      Join Group Link
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {detailUrl && (
                        <SharePopover title={group.title} url={detailUrl}>
                        <Button variant="outline" className="w-full text-lg py-6 sm:w-auto">
                            <Share2 className="mr-2 h-5 w-5" />
                            Share
                        </Button>
                        </SharePopover>
                    )}
                     <Button variant="destructive" className="w-full text-lg py-6 sm:w-auto" onClick={() => setIsReportOpen(true)}>
                        <Flag className="mr-2 h-5 w-5" />
                        Report
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              <div className="mt-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Info className="h-5 w-5" />
                      Before You Join This Group...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">How to Join a WhatsApp Group Link</h3>
                      <p className="text-sm text-muted-foreground">
                        Clicking the &quot;Join Group Link&quot; button will redirect
                        you to WhatsApp to confirm joining the group. Make sure
                        you have WhatsApp installed on your device.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Group Etiquette</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rules.map(rule => (
                          <div key={rule.title} className="flex items-start gap-3">
                            <rule.icon className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-sm">
                                {rule.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {rule.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                     <Alert variant="destructive">
                      <ShieldCheck className="h-4 w-4" />
                      <AlertTitle>Privacy & Safety</AlertTitle>
                      <AlertDescription>
                        By joining this WhatsApp group, you agree to the group&apos;s rules and WhatsApp&apos;s terms of service. Admins may remove any member for violating guidelines. Your public profile and phone number will be visible to all members of the group.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Related Group Links</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {relatedGroups.length > 0 ? (
                    relatedGroups.map(relatedGroup => (
                      <GroupCard
                        key={relatedGroup.id}
                        group={relatedGroup}
                        view="grid"
                        onTagClick={handleTagClick}
                        showClicks={relatedGroup.showClicks ?? true}
                        showRatings={settings?.showRatings ?? true}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No related group links found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />
        </div>
      </main>
      <GroupReportDialog
        group={group}
        isOpen={isReportOpen}
        onOpenChange={setIsReportOpen}
      />
    </div>
  );
}
