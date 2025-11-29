
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { NewsletterSignup } from '@/components/layout/newsletter-signup';
import { getModerationSettings } from '@/lib/admin-settings';
import { getLayoutSettings, getCategories, getCountries } from './admin/actions';
import { Header } from '@/components/layout/header';
import { TopProgressBar } from '@/components/layout/top-progress-bar';
import { Suspense } from 'react';
import { Providers } from './providers';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap', // Improves font loading performance
});

export async function generateMetadata(): Promise<Metadata> {
  const layoutSettings = await getLayoutSettings();
  const { seoSettings, logoUrl: configLogoUrl } = layoutSettings;
  const logoUrl = configLogoUrl || '/whatsuplink_logo_and_favicon_without_background.png';

  const title = seoSettings.siteTitle;
  const description = seoSettings.metaDescription;

  return {
    metadataBase: new URL('https://whatsuplink.online'),
    title: {
      default: title,
      template: '%s | WhatsUpLink',
    },
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: 'https://whatsuplink.online',
      siteName: 'WhatsUpLink',
      locale: 'en_US',
      type: 'website',
      images: [logoUrl],
    },
    keywords: seoSettings.metaKeywords,
    icons: {
      icon: '/favicon.ico', // Standard favicon path
      apple: '/apple-touch-icon.png', // Standard Apple touch icon path
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}


export const viewport: Viewport = {
  themeColor: '#25D366',
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [moderationSettings, layoutSettings, categories, countries] = await Promise.all([
    getModerationSettings(),
    getLayoutSettings(),
    getCategories(),
    getCountries(),
  ]);
  
  const bodyStyle: React.CSSProperties = {};
  if (layoutSettings.backgroundSettings.bgImageEnabled && layoutSettings.backgroundSettings.bgImageUrl) {
    bodyStyle['--background-image' as any] = `url(${layoutSettings.backgroundSettings.bgImageUrl})`;
  } else {
    bodyStyle['--background-image' as any] = 'none';
  }


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The AdSense script is now handled via the next/script component below */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8130991342525434"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} font-body antialiased`} style={bodyStyle}>
        <Suspense>
          <TopProgressBar />
        </Suspense>
        <div className="flex flex-col min-h-screen">
          <Providers>
            <Header 
              navLinks={layoutSettings.navLinks} 
              logoUrl={layoutSettings.logoUrl}
              categories={categories}
              countries={countries}
            />
            <main className="flex-1 relative z-10">
              {children}
            </main>
            <ScrollToTop />
            <Toaster />
            <footer className="border-t bg-card">
              <div className="container py-12">
                <div className={`flex flex-col md:flex-row items-center gap-12 ${moderationSettings.showNewsletter ? 'justify-between' : 'justify-center'}`}>
                  <div className={`flex flex-col items-center ${moderationSettings.showNewsletter ? 'md:items-start text-center md:text-left' : 'text-center md:items-center md:text-center'}`}>
                      <h3 className="text-xl font-bold">{layoutSettings.footerContent.heading}</h3>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        {layoutSettings.footerContent.paragraph}
                      </p>
                       <p className="text-sm text-muted-foreground mt-8">
                          {layoutSettings.footerContent.copyrightText}
                        </p>
                  </div>
                  {moderationSettings.showNewsletter && (
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <NewsletterSignup />
                    </div>
                  )}
                </div>
              </div>
            </footer>
          </Providers>
        </div>
      </body>
    </html>
  );
}
