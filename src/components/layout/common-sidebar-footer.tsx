'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Settings, LogOut, LifeBuoy } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useToast } from '@/hooks/use-toast';
import type { AppSettings } from '@/lib/types';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

interface CommonSidebarFooterProps {
  settingsPath: string;
  children?: React.ReactNode;
}

export function CommonSidebarFooter({ settingsPath, children }: CommonSidebarFooterProps) {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsDocRef = useMemo(() => {
    if (!firestore) return;
    return doc(firestore, 'settings', 'global');
  }, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      router.push('/');
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
    <SidebarMenu>
      {children}
      {settings?.supportLink && (
        <SidebarMenuItem>
          <a href={settings.supportLink} target="_blank" rel="noopener noreferrer">
            <SidebarMenuButton tooltip="Support Team">
              <LifeBuoy />
              <span className="group-data-[collapsible=icon]:hidden">Support Team</span>
            </SidebarMenuButton>
          </a>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
          <Link href={settingsPath} legacyBehavior passHref>
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
  );
}
