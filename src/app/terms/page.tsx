
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/breadcrumbs';

export default async function TermsOfServicePage() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Terms of Service' },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <main className="flex-1 bg-card">
        <div className="container py-12 md:py-24">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="prose max-w-none text-muted-foreground">
              <p>
                Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the WhatsUpLink website (the "Service") operated by us.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Acceptance of Terms</h2>
              <p>
                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Content Submissions</h2>
              <p>
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
              </p>
              <p>
                You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity. We reserve the right to terminate the account of anyone found to be infringing on a copyright.
              </p>
              <p>
                You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third party posts on or through the Service.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Prohibited Uses</h2>
              <p>
                You agree not to submit any content that is illegal, obscene, threatening, defamatory, invasive of privacy, or otherwise injurious to third parties. You may not use a false e-mail address, impersonate any person or entity, or otherwise mislead as to the origin of a card or other content.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Changes</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
              </p>

              <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
