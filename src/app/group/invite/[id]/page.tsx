import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getGroupById, getRelatedGroups, type GroupLink } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupCard } from '@/components/groups/group-card';
import { Separator } from '@/components/ui/separator';

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const group = getGroupById(params.id);
  const relatedGroups = getRelatedGroups(group);

  if (!group) {
    notFound();
  }

  // We need a dummy onTagClick for the GroupCard since it's required, 
  // but there's no filtering on the detail page.
  const handleTagClick = () => {};

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8 md:py-12">
            <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2"/>
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
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{group.title}</h1>
                                </div>
                             </div>
                        </CardHeader>
                        <CardContent className="p-6">
                           <div className="flex items-center gap-4 mb-4">
                                <Badge variant="secondary">{group.category}</Badge>
                                <Badge variant="outline" className="capitalize">{group.country}</Badge>
                           </div>
                           <p className="text-base text-foreground/80 whitespace-pre-wrap">{group.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full text-lg py-6">
                                <a href={group.link} target="_blank" rel="noopener noreferrer">
                                    Join Now
                                    <ExternalLink className="ml-2"/>
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="mt-8 prose prose-quoteless prose-neutral dark:prose-invert max-w-none">
                        <h2 className="text-xl font-semibold">Joining a WhatsApp Group</h2>
                        <p>
                           Joining a WhatsApp group via a link is a straightforward process. When you click the "Join Now" button, you will be redirected to WhatsApp, where you can confirm your intention to join the group. Ensure you have WhatsApp installed on your device.
                        </p>
                        <h3 className="text-lg font-semibold">Group Rules & Privacy</h3>
                        <ul>
                            <li><strong>Be Respectful:</strong> Treat all members with respect. Harassment, hate speech, and bullying are not tolerated.</li>
                            <li><strong>No Spam:</strong> Avoid posting unsolicited advertisements or spamming the group with irrelevant messages.</li>
                            <li><strong>Privacy:</strong> Be mindful of the information you share. Your phone number will be visible to all group members. Do not share personal or sensitive information about yourself or others without consent.</li>
                            <li><strong>Follow Group-Specific Rules:</strong> The group admin may have specific rules. Please read and adhere to them.</li>
                        </ul>
                         <p>
                           By joining, you agree to the group's rules and WhatsApp's terms of service. Admins reserve the right to remove any member who violates these guidelines.
                        </p>
                    </div>

                </div>

                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">Related Groups</h2>
                    <div className="flex flex-col gap-4">
                        {relatedGroups.length > 0 ? (
                             relatedGroups.map(relatedGroup => (
                                <GroupCard key={relatedGroup.id} group={relatedGroup} view="list" onTagClick={handleTagClick} />
                            ))
                        ) : (
                            <p className="text-muted-foreground">No related groups found.</p>
                        )}
                    </div>
                </div>

            </div>

             <Separator className="my-12" />

        </div>
      </main>
      <footer className="border-t bg-background">
          <div className="container py-6 text-center text-sm text-muted-foreground">
            Built for WhatsUpLink. &copy; {new Date().getFullYear()}
          </div>
      </footer>
    </div>
  );
}
