
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users } from 'lucide-react';
import { useMemo } from 'react';

export default function TeamPage() {
    const { user } = useUser();
    const { toast } = useToast();

    const referralLink = useMemo(() => {
        if (!user) return '';
        // In a real app, this might be a custom domain
        return `${window.location.origin}/signup?ref=${user.uid}`;
    }, [user]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: 'Copied!',
            description: 'Referral link copied to clipboard.',
        });
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">My Team</h2>
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Referral Link</CardTitle>
                        <CardDescription>Share this link to invite new members and earn commissions.</CardDescription>
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
                        <p className="text-xs text-muted-foreground">
                            You'll earn a percentage from the deposits of every user who signs up through your link.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Referral Program</CardTitle>
                        <CardDescription>Our commission structure.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center"><Gift className="h-4 w-4 mr-2 text-primary"/> Level 1 Commission:</span>
                            <span className="font-bold">7%</span>
                        </div>
                        <div className="flex items-center justify-between">
                             <span className="flex items-center"><Gift className="h-4 w-4 mr-2 text-yellow-500"/> Level 2 Commission:</span>
                            <span className="font-bold">3%</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="flex items-center"><Gift className="h-4 w-4 mr-2 text-purple-500"/> Level 3 Commission:</span>
                            <span className="font-bold">1%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Your Team Members</CardTitle>
                    <CardDescription>A list of users who joined using your referral link.</CardDescription>
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
