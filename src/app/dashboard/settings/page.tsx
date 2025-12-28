'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, User, Mail, Gift, AtSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType } from '@/lib/types';


export default function SettingsPage() {
    const { toast } = useToast();
    const { user, userData, loading: userLoading } = useUser();
    const typedUserData = userData as UserType | null;

    const handleCopy = (text: string | undefined) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Copied to clipboard.',
        });
    };

    if (userLoading || !typedUserData) {
        return (
             <div className="flex-1 space-y-8 p-4">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-20" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                             <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                             <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-4">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>These details are linked to your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="displayName">Full Name</Label>
                        <div className="relative">
                             <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="displayName" readOnly value={typedUserData?.displayName ?? ''} className="pl-10"/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="email" readOnly value={user?.email ?? ''} className="pl-10"/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                            <Input id="username" readOnly value={typedUserData?.username ?? ''} className="pl-10"/>
                             <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referralCode">Your Referral Code</Label>
                        <div className="relative">
                            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="referralCode" readOnly value={typedUserData?.referralCode ?? ''} className="pr-10 pl-10 font-mono"/>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => handleCopy(typedUserData?.referralCode)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
