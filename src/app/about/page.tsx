
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';

export default async function AboutPage() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About' },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <main className="flex-1 bg-card">
        <div className="container py-12 md:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">About WhatsUpLink</h1>
              <p className="text-lg text-muted-foreground">
                Your number one directory for discovering and sharing WhatsApp group links.
              </p>
            </div>
            <div className="space-y-6 text-lg">
              <p>
                Welcome to WhatsUpLink! Our mission is to create a comprehensive and easy-to-use directory of WhatsApp group links from around the world. Whether you're looking for a group to discuss your favorite hobbies, stay updated on news, connect with professionals in your field, or just find a fun community, we've got you covered. From USA WhatsApp group links to communities for gaming like PUBG and Freefire, our goal is to be the ultimate resource.
              </p>
              <p>
                Our platform allows users to easily submit new WhatsApp group links, helping our directory grow and stay up-to-date. Each submission for a group link is reviewed to ensure quality and safety for our community. You can browse groups by category, country, or search for specific keywords to find exactly what you're looking for, including family WhatsApp group links, entertainment groups, and even adult WhatsApp group links.
              </p>
              <p>
                We believe in the power of community and connection. WhatsUpLink was built to bridge the gap and make it easier for people to find their tribes by sharing and joining the best WhatsApp group links available. Thank you for being a part of our growing community!
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
