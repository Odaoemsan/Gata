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
  const isAuthPage = React.Children.toArray(children).some(
    (child: any) =>
      child.props.childProp?.segment === 'login' ||
      child.props.childProp?.segment === 'signup'
  );
  
   const isDashboard = React.Children.toArray(children).some(
    (child: any) =>
      child.props.childProp?.segment === 'dashboard' ||
       child.props.childProp?.segment === 'admin'
  );


  if (isAuthPage || isDashboard) {
     return (
        <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
          <body className={`${inter.variable} ${lexend.variable} font-body antialiased`}>
            <FirebaseProvider>
              {children}
              <Toaster />
            </FirebaseProvider>
          </body>
        </html>
      );
  }

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={`${inter.variable} ${lexend.variable} font-body antialiased`}>
        <FirebaseProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
