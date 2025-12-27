
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
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const router = useRouter();
  const { user, userData } = useUser();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();

  const handleSignOut = async () => {
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

  const menuItems = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

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
           <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/dashboard" legacyBehavior passHref>
                    <SidebarMenuButton isActive={pathname === '/dashboard'}>
                        Dashboard
                    </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/dashboard/settings" legacyBehavior passHref>
                    <SidebarMenuButton isActive={pathname === '/dashboard/settings'}>
                        <Settings />
                        Settings
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
           </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                    <LogOut />
                    Sign Out
                </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <span className="font-semibold">GORA</span>
            </div>
             <Link href="/dashboard/settings">
                <Avatar>
                    <AvatarFallback>{user?.email?.[0].toUpperCase() ?? 'A'}</AvatarFallback>
                </Avatar>
            </Link>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
