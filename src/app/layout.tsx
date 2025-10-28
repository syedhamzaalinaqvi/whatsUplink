
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { FirebaseProvider } from '@/firebase/provider';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { NewsletterSignup } from '@/components/layout/newsletter-signup';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'WhatsUpLink',
  description: 'The ultimate directory to discover and share WhatsApp group links.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <div className="flex flex-col min-h-screen">
          <FirebaseProvider>
            <div className="flex-1">
              {children}
            </div>
            <ScrollToTop />
            <Toaster />
            <footer className="border-t bg-background/95 backdrop-blur">
              <div className="container py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                      <h3 className="text-xl font-bold">WhatsUpLink</h3>
                      <p className="text-muted-foreground mt-2 max-w-md">
                        Your number one directory for discovering and sharing WhatsApp group links.
                      </p>
                       <p className="text-sm text-muted-foreground mt-8">
                          Built for WhatsUpLink. &copy; {new Date().getFullYear()}
                        </p>
                  </div>
                  <div className="flex-shrink-0">
                    <NewsletterSignup />
                  </div>
                </div>
              </div>
            </footer>
          </FirebaseProvider>
        </div>
      </body>
    </html>
  );
}
