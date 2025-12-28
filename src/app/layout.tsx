'use client';

import { usePathname } from 'next/navigation';
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
});

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-lexend',
});

// Metadata is defined in a wrapper component to allow usePathname in the layout
// export const metadata: Metadata = {
//   title: 'GORA HYIP - High-Yield Investment Program',
//   description:
//     'Invest with GORA and watch your capital grow. Secure, profitable, and user-friendly investment platform.',
// };

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showHeaderFooter = pathname === '/';

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}
