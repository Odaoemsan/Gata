'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Share2, Award, Check, Loader2, DollarSign } from 'lucide-react';
import type { User, Rank } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeamPage() {
    const { userData, user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const typedUserData = userData as User | null;

    // Query to get the user's team
    const teamQuery = useMemo(() => {
        if (!firestore || !typedUserData?.referralCode) return null;
        return query(collection(firestore, 'users'), where('referredBy', '==', typedUserData.referralCode));
    }, [firestore, typedUserData?.referralCode]);

    const { data: teamMembers, loading: teamLoading } = useCollection<User>(teamQuery);

    // Query to get all available ranks
    const ranksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'ranks'));
    }, [firestore]);
    const { data: ranks, loading: ranksLoading } = useCollection<Rank>(ranksQuery);

    // Calculate total team deposits
    const teamTotalDeposits = useMemo(() => {
        if (!teamMembers) return 0;
        return teamMembers.reduce((acc, member) => acc + (member.totalDeposits || 0), 0);
    }, [teamMembers]);

    const handleCopy = () => {
        if (!typedUserData?.referralCode) return;
        navigator.clipboard.writeText(typedUserData.referralCode);
        toast({
            title: 'Copied!',
            description: 'Referral code copied to clipboard.',
        });
    };

    const handleRankCheck = () => {
        if (!ranks || ranksLoading || teamLoading) return;
        
        // Find the highest rank the user has achieved
        const currentRank = ranks.slice().reverse().find(rank => teamTotalDeposits >= rank.requiredInvestment);

        if (currentRank) {
             toast({
                title: 'Rank Status',
                description: `You currently qualify for the ${currentRank.name} rank!`,
            });
        } else {
             toast({
                title: 'Rank Status',
                description: "You haven't qualified for a rank yet. Keep growing your team!",
            });
        }
    };

    const isLoading = userLoading || teamLoading || ranksLoading;

    return (
        <div className="flex-1 space-y-6 p-4">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">My Team & Ranks</h2>
                <p className="text-muted-foreground mt-1">Invite members, track team progress, and climb the ranks.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Share2 className="h-6 w-6 text-primary" />
                        <CardTitle>Your Referral Code</CardTitle>
                    </div>
                    <CardDescription>Share this 7-character code with new members to add them to your team.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Input
                            readOnly
                            value={userLoading ? "Loading..." : typedUserData?.referralCode || ''}
                            className="pr-12 text-lg md:text-xl font-mono tracking-widest text-center"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleCopy}
                            disabled={userLoading}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Team Deposits</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{formatCurrency(teamTotalDeposits)}</div>}
                       <p className="text-xs text-muted-foreground">Total invested by your referred members.</p>
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">My Commissions</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {userLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold text-green-500">{formatCurrency(typedUserData?.referralCommissions)}</div>}
                        <p className="text-xs text-muted-foreground">Total commissions earned from your team.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <Award className="h-6 w-6" />
                        <CardTitle>Referral Ranks</CardTitle>
                    </div>
                    <CardDescription>Achieve new ranks by increasing your team's total investment to earn higher commissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Required Team Investment</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ranksLoading && [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {!ranksLoading && ranks?.sort((a, b) => a.requiredInvestment - b.requiredInvestment).map(rank => (
                                <TableRow key={rank.id} className={!isLoading && teamTotalDeposits >= rank.requiredInvestment ? 'bg-primary/10' : ''}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {!isLoading && teamTotalDeposits >= rank.requiredInvestment && <Check className="h-4 w-4 text-green-500" />}
                                        {rank.name}
                                    </TableCell>
                                    <TableCell>{formatCurrency(rank.requiredInvestment)}</TableCell>
                                    <TableCell className="text-right font-semibold">{rank.commissionRate}%</TableCell>
                                </TableRow>
                            ))}
                             {!ranksLoading && ranks?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No ranks have been configured by the admin yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Button onClick={handleRankCheck} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Check My Rank Status
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
