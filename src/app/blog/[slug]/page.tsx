
import { notFound } from 'next/navigation';
import { posts } from '@/lib/blog-data';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';
import type { Metadata } from 'next';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = posts.find(p => p.slug === params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | WhatsUpLink Blog`,
    description: post.description,
    openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: new Date(post.date).toISOString(),
    }
  };
}

export async function generateStaticParams() {
  return posts.map(post => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: Props) {
  const post = posts.find(p => p.slug === params.slug);

  if (!post || !post.published) {
    notFound();
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <main className="container py-12 md:py-16">
        <article className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tighter mb-4">{post.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <time dateTime={post.date}>{format(new Date(post.date), 'MMMM d, yyyy')}</time>
            </div>
          </header>
          <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
        </article>
      </main>
    </>
  );
}
