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
import { Settings, LayoutDashboard, Shield, Package, Users, Wallet, Award, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonSidebarFooter } from '@/components/layout/common-sidebar-footer';


const ADMIN_NAV_ITEMS = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/plans', icon: Package, label: 'Plans' },
    { href: '/admin/transactions', icon: Wallet, label: 'Transactions' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/ranks', icon: Award, label: 'Ranks' },
    { href: '/admin/tasks', icon: ListTodo, label: 'Tasks' },
];

function AdminBottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-6 items-center justify-around">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin');
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href} className="flex justify-center">
              <div className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-md transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
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
  const { user, loading } = useUser();
  const { toast } = useToast();
  const ADMIN_EMAIL = 'odae.oth@gmail.com';
  const isAuthorized = user?.email === ADMIN_EMAIL;
  
  useEffect(() => {
    if (!loading && !isAuthorized) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the admin area.',
      });
      router.push('/dashboard');
    }
  }, [isAuthorized, loading, router, toast]);

  
  if (loading || !isAuthorized) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying access...</p>
        </div>
    )
  }

  const sidebarMenuItems = [
    ...ADMIN_NAV_ITEMS.map(item => ({...item, label: `Manage ${item.label}`})),
  ];
   sidebarMenuItems[0].label = 'Dashboard'; // Keep dashboard label simple


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
            {sidebarMenuItems.map(item => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton tooltip={item.label} isActive={pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin')}>
                            <item.icon />
                            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
           </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <CommonSidebarFooter settingsPath="/admin/settings">
             <SidebarMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                    <SidebarMenuButton tooltip="Back to App">
                        <Shield />
                        <span className="group-data-[collapsible=icon]:hidden">Back to App</span>
                    </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
           </CommonSidebarFooter>
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
