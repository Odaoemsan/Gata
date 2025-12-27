
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users, Share2 } from 'lucide-react';
import { useMemo } from 'react';

export default function TeamPage() {
    const { userData } = useUser();
    const { toast } = useToast();

    const referralLink = useMemo(() => {
        if (typeof window === 'undefined' || !userData?.username) return '';
        // In a real app, this might be a custom domain
        return `${window.location.origin}/signup?ref=${userData.username}`;
    }, [userData]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: 'Copied!',
            description: 'Referral link copied to clipboard.',
        });
    };

    return (
        <div className="flex-1 space-y-6 p-4">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">My Team</h2>
                <p className="text-muted-foreground mt-1">Invite friends and earn commissions.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Share2 className="h-6 w-6 text-primary" />
                        <CardTitle>Your Referral Link</CardTitle>
                    </div>
                    <CardDescription>Share this link to invite new members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Input
                            readOnly
                            value={referralLink}
                            className="pr-12 text-sm"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleCopy}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <Gift className="h-6 w-6 text-yellow-500" />
                        <CardTitle>Referral Program</CardTitle>
                    </div>
                    <CardDescription>Our commission structure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">Level 1 Commission:</span>
                        <span className="font-bold text-primary">7%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">Level 2 Commission:</span>
                        <span className="font-bold text-yellow-500">3%</span>
                    </div>
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                       <span className="font-medium">Level 3 Commission:</span>
                        <span className="font-bold text-purple-500">1%</span>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <Users className="h-6 w-6" />
                        <CardTitle>Your Team Members</CardTitle>
                    </div>
                    <CardDescription>Users who joined using your link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                        <Users className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">You have no team members yet.</p>
                        <p className="text-sm text-muted-foreground">Start sharing your link to build your team!</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    
