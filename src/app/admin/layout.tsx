
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
import { Settings, LogOut, LayoutDashboard, Shield, Package, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = 'odae.oth@gmail.com';

function AdminBottomNavBar() {
  const pathname = usePathname();
  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/plans', icon: Package, label: 'Plans' },
    { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
    { href: '/admin/users', icon: Users, label: 'Users' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-4 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin');
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userData, loading } = useUser();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the admin area.',
      });
      router.push('/dashboard');
    }
  }, [user, loading, router, toast]);


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
  
  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying admin access...</p>
        </div>
    )
  }

  const menuItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/plans', icon: Package, label: 'Manage Plans' },
    { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
    { href: '/admin/users', icon: Users, label: 'Manage Users' },
    // Add other admin links here
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-3">
                 <Avatar className="ring-2 ring-primary">
                    <AvatarFallback>{user?.email?.[0].toUpperCase() ?? 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-semibold">Admin Panel</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
            </div>
        </SidebarHeader>
        <SidebarContent>
           <SidebarMenu>
            {menuItems.map(item => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton tooltip={item.label} isActive={pathname === item.href}>
                            <item.icon />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
           </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Back to App">
                        <Shield />
                        <span className="group-data-[collapsible=icon]:hidden">Back to App</span>
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
                <span className="font-semibold text-lg">GORA - Admin</span>
            </div>
             <div className="hidden md:flex items-center gap-4">
                 <Link href="/dashboard">
                    <Button variant="outline" size="sm">Back to App</Button>
                 </Link>
             </div>
        </header>
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
        <AdminBottomNavBar />
      </div>
    </SidebarProvider>
  );
}
