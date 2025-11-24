

export default async function PrivacyPolicyPage() {
  return (
    <main className="flex-1 bg-card">
      <div className="container py-12 md:py-24">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="prose max-w-none text-muted-foreground">
            <p>
              Welcome to WhatsUpLink. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect on the Site includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Group Information:</strong> When you submit a WhatsApp group, we collect the information you provide, such as the group link, title, description, category, country, and tags. This information is made public on our platform.
              </li>
              <li>
                <strong>Newsletter Subscription:</strong> If you choose to subscribe to our newsletter, we collect your email address. This is used to send you updates and news related to our service.
              </li>
              <li>
                <strong>Usage Data:</strong> We may automatically collect certain info when you access the Site, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Site.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Use of Your Information</h2>
            <p>
              Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage our directory of WhatsApp groups.</li>
              <li>Send you our newsletter, if you have subscribed.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
              <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Disclosure of Your Information</h2>
            <p>
              We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information, except for the purpose of operating our newsletter service. All group information you submit is intended for public display on our platform.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us through the contact form on our website.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
