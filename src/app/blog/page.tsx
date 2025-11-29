
import Link from 'next/link';
import { posts } from '@/lib/blog-data';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';
import type { Metadata } from 'next';
import { format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Blog | WhatsUpLink',
  description: 'Articles, tips, and updates from the WhatsUpLink team on how to find, manage, and grow your WhatsApp communities safely and effectively.',
};

export default function BlogPage() {
  const publishedPosts = posts
    .filter(post => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog' },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Our Blog</h1>
            <p className="text-lg text-muted-foreground">
              Tips, tricks, and insights on managing and growing your WhatsApp communities.
            </p>
          </div>

          <div className="space-y-10">
            {publishedPosts.map(post => (
              <Link href={`/blog/${post.slug}`} key={post.slug} className="block group">
                <Card className="transition-shadow duration-300 hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(post.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <CardDescription className="pt-4 text-base">
                      {post.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="link" className="px-0">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
