'use client';

import { usePathname } from 'next/navigation';
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

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showHeaderFooter = !pathname.startsWith('/dashboard') && !pathname.startsWith('/admin') && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <title>GORA HYIP - High-Yield Investment Program</title>
        <meta name="application-name" content="GORA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GORA" />
        <meta name="description" content="GORA HYIP - High-Yield Investment Program" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
