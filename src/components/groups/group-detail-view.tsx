
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
} from 'lucide-react';
import type { GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
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
import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase/provider';
import { doc, increment, updateDoc } from 'firebase/firestore';

type GroupDetailViewProps = {
  group: GroupLink;
  relatedGroups: GroupLink[];
};

export function GroupDetailView({ group, relatedGroups }: GroupDetailViewProps) {
  const [detailUrl, setDetailUrl] = useState('');
  const { firestore } = useFirestore();

  useEffect(() => {
    // Ensure this runs only on the client
    setDetailUrl(window.location.href);
  }, []);

  const handleJoinClick = () => {
    if (firestore && group.id) {
      const groupRef = doc(firestore, 'groups', group.id);
      updateDoc(groupRef, {
        clicks: increment(1),
      }).catch(err => console.error("Failed to increment click count", err));
    }
  };

  // We need a dummy onTagClick for the GroupCard since it's required,
  // but there's no filtering on the detail page.
  const handleTagClick = () => {};


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

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container py-8 md:py-12">
          <div className="mb-8">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Groups
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
                      alt={`Banner for ${group.title}`}
                      fill
                      className="object-cover"
                      data-ai-hint={group.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                        {group.title}
                      </h1>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <Badge variant="secondary">{group.category}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {group.country}
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
                    {group.showClicks && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>{group.clicks ?? 0} views</span>
                        </div>
                    )}
                  </div>
                  <p className="text-base text-foreground/80 whitespace-pre-wrap">
                    {group.description}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="w-full text-lg py-6 flex-1">
                    <a
                      href={group.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleJoinClick}
                    >
                      Join Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  {detailUrl && (
                    <SharePopover title={group.title} url={detailUrl}>
                      <Button variant="outline" className="w-full sm:w-auto text-lg py-6">
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                      </Button>
                    </SharePopover>
                  )}
                </CardFooter>
              </Card>

              <div className="mt-12">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Info className="h-5 w-5" />
                      Before You Join...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">How to Join</h3>
                      <p className="text-sm text-muted-foreground">
                        Clicking the &quot;Join Now&quot; button will redirect
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
                        By joining, you agree to the group&apos;s rules and WhatsApp&apos;s terms of service. Admins may remove any member for violating guidelines. Your public profile and phone number will be visible to all members.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Related Groups</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {relatedGroups.length > 0 ? (
                  relatedGroups.map(relatedGroup => (
                    <GroupCard
                      key={relatedGroup.id}
                      group={relatedGroup}
                      view="grid"
                      onTagClick={handleTagClick}
                      showClicks={relatedGroup.showClicks ?? true}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No related groups found.
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-12" />
        </div>
      </main>
    </div>
  );
}
