
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { FirebaseProvider } from '@/firebase/provider';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { NewsletterSignup } from '@/components/layout/newsletter-signup';
import { getModerationSettings, getLayoutSettings } from './admin/actions';
import { Header } from '@/components/layout/header';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://whatsuplink.online'),
  title: {
    default: 'WhatsUpLink: Discover & Share WhatsApp Groups',
    template: '%s | WhatsUpLink',
  },
  description: 'The ultimate directory to discover, share, and join thousands of WhatsApp groups and channels from around the world. Find communities for your hobbies, interests, and more.',
  openGraph: {
    title: 'WhatsUpLink: Discover & Share WhatsApp Groups',
    description: 'The ultimate directory to discover and share WhatsApp group links.',
    url: 'https://whatsuplink.online',
    siteName: 'WhatsUpLink',
    locale: 'en_US',
    type: 'website',
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

export const viewport: Viewport = {
  themeColor: '#25D366',
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const moderationSettings = await getModerationSettings();
  const layoutSettings = await getLayoutSettings();

  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        {/* Render custom scripts from admin settings */}
        {layoutSettings.headerScripts && (
          <div dangerouslySetInnerHTML={{ __html: layoutSettings.headerScripts }} />
        )}
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <div className="flex flex-col min-h-screen">
          <FirebaseProvider>
            <Header navLinks={layoutSettings.navLinks} />
            <div className="flex-1">
              {children}
            </div>
            <ScrollToTop />
            <Toaster />
            <footer className="border-t bg-background/95 backdrop-blur">
              <div className="container py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
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
          </FirebaseProvider>
        </div>
      </body>
    </html>
  );
}
