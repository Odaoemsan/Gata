
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
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
           {/* Navigation links can be added here in the future if needed */}
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
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
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <span className="font-semibold text-lg hidden md:inline">GORA</span>
            </div>
             <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
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
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
