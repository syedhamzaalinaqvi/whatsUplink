
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { FirebaseProvider } from '@/firebase/provider';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { NewsletterForm } from '@/components/layout/newsletter-form';

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
        <FirebaseProvider>
          {children}
          <ScrollToTop />
        </FirebaseProvider>
        <Toaster />
        <footer className="border-t bg-background">
          <div className="container py-8 grid lg:grid-cols-2 gap-8">
            <NewsletterForm />
            <div className="flex flex-col items-center justify-center text-center lg:items-end">
              <p className="text-sm text-muted-foreground">
                Built for WhatsUpLink. &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
