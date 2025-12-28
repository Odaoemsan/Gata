
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ActiveInvestment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, History, CheckCircle, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';


function StatusBadge({ status }: { status: ActiveInvestment['status'] }) {
    const variant = {
        active: 'default',
        completed: 'secondary',
    }[status] as "default" | "secondary";
    
    const icon = {
        active: <Hourglass className="mr-1 h-3 w-3" />,
        completed: <CheckCircle className="mr-1 h-3 w-3" />,
    }[status]

    return (
        <Badge variant={variant} className="capitalize flex items-center w-fit">
            {icon}
            {status}
        </Badge>
    );
}


function InvestmentSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function MyInvestmentsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const investmentsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
          collection(firestore, 'users', user.uid, 'activeInvestments'),
          orderBy('startDate', 'desc')
        );
    }, [user, firestore]);
    
    const { data: investments, loading } = useCollection<ActiveInvestment>(investmentsQuery);

    const activeInvestments = useMemo(() => investments?.filter(inv => inv.status === 'active') ?? [], [investments]);
    const completedInvestments = useMemo(() => investments?.filter(inv => inv.status === 'completed') ?? [], [investments]);

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">My Investments</h2>
                    <p className="text-muted-foreground mt-1">Your active and completed investment plans.</p>
                </div>
                <InvestmentSkeleton />
            </div>
        )
    }
    
    if (!investments || investments.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
                <Rocket className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Investments Yet</h3>
                <p className="text-muted-foreground mt-2">You haven't made any investments. Explore our plans to get started.</p>
                <Button asChild className="mt-6">
                    <Link href="/dashboard/invest">View Investment Plans</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">My Investments</h2>
                <p className="text-muted-foreground mt-1">Your active and completed investment plans.</p>
            </div>

            {/* Active Investments */}
            {activeInvestments.length > 0 && (
                 <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><Hourglass className="h-5 w-5 text-primary" /> Active Investments</h3>
                    {activeInvestments.map(inv => (
                        <Card key={inv.id} className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                             <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{inv.planName}</CardTitle>
                                        <CardDescription>{formatCurrency(inv.amount)}</CardDescription>
                                    </div>
                                    <StatusBadge status={inv.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm">
                               <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start Date</span>
                                    <span className="font-medium">{formatDate(inv.startDate)}</span>
                               </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">End Date</span>
                                    <span className="font-medium">{formatDate(inv.endDate)}</span>
                               </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Completed Investments */}
            {completedInvestments.length > 0 && (
                <div className="space-y-4">
                     <h3 className="text-xl font-semibold flex items-center gap-2"><History className="h-5 w-5 text-muted-foreground" /> Investment History</h3>
                     {completedInvestments.map(inv => (
                        <Card key={inv.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{inv.planName}</CardTitle>
                                        <CardDescription>{formatCurrency(inv.amount)}</CardDescription>
                                    </div>
                                    <StatusBadge status={inv.status} />
                                </div>
                            </CardHeader>
                           <CardContent className="grid gap-2 text-sm">
                               <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start Date</span>
                                    <span className="font-medium">{formatDate(inv.startDate)}</span>
                               </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">End Date</span>
                                    <span className="font-medium">{formatDate(inv.endDate)}</span>
                               </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
