'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, LogOut, LayoutDashboard, Rocket, Users, Wallet, CircleDollarSign, Shield, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import type { AppSettings } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';


function BottomNavBar() {
  const pathname = usePathname();
  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/dashboard/my-investments', icon: Rocket, label: 'My Investments' },
    { href: '/dashboard/earnings', icon: CircleDollarSign, label: 'Earnings', isCentral: true },
    { href: '/dashboard/team', icon: Users, label: 'Team' },
    { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-5 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          if (item.isCentral) {
            return (
              <div key={item.href} className="flex justify-center">
                <Link href={item.href} className="relative -top-6">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary shadow-lg ring-4 ring-background">
                    <item.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                </Link>
              </div>
            );
          }
          return (
            <Link href={item.href} key={item.href} className="flex justify-center">
              <div className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-md transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const { user, userData } = useUser();
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const ADMIN_EMAIL = 'odae.oth@gmail.com';

  const settingsDocRef = useMemo(() => {
    if (!firestore) return;
    return doc(firestore, 'settings', 'global');
  }, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsDocRef);
  
  const handleSignOut = async () => {
    if (!firebaseApp) return;
    const auth = getAuth(firebaseApp);
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
      });
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-3">
                 <Avatar>
                    <AvatarFallback>{user?.email?.[0].toUpperCase() ?? 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">{userData?.displayName ?? 'Anonymous User'}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
            </div>
        </SidebarHeader>
        <SidebarContent>
           {/* Navigation links for desktop can be added here */}
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
            {user?.email === ADMIN_EMAIL && (
                <SidebarMenuItem>
                    <Link href="/admin" legacyBehavior passHref>
                        <SidebarMenuButton tooltip="Admin Panel">
                            <Shield />
                            <span className="group-data-[collapsible=icon]:hidden">Admin Panel</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
             <SidebarMenuItem>
                <Link href="/dashboard/settings" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Settings">
                        <Settings />
                        <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                    </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden"/>
                <span className="font-semibold text-lg">GORA</span>
            </div>
             <div className="hidden md:flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="font-semibold text-sm">{userData?.displayName}</span>
                    <span className="text-xs text-muted-foreground">ID: {userData?.username}</span>
                </div>
                <Link href="/dashboard/settings">
                    <Avatar>
                        <AvatarFallback>{user?.email?.[0].toUpperCase() ?? 'A'}</AvatarFallback>
                    </Avatar>
                </Link>
             </div>
        </header>
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNavBar />
      </div>
    </SidebarProvider>
  );
}
