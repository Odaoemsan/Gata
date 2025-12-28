import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseProvider } from '@/firebase';
import { Inter, Lexend } from 'next/font/google';
import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: 'GORA HYIP - High-Yield Investment Program',
  description:
    'Invest with GORA and watch your capital grow. Secure, profitable, and user-friendly investment platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This is a workaround to get the segment path from the children props.
  // The segment for the root page is `__DEFAULT__`. For other pages it will be the route name (e.g., 'login', 'dashboard').
  const segmentPath = (React.Children.toArray(children)[0] as any)?.props?.childProp?.segment;

  // Show header/footer ONLY on the landing page.
  const showHeaderFooter = segmentPath === '__DEFAULT__';
  
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.variable} ${lexend.variable} font-body antialiased`}>
        <FirebaseProvider>
          {showHeaderFooter ? (
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          ) : (
            children
          )}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
