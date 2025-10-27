import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { FirebaseProvider } from '@/firebase/provider';
import { ScrollToTop } from '@/components/layout/scroll-to-top';

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
      </body>
    </html>
  );
}
