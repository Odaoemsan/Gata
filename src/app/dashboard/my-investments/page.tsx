
'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import type { ActiveInvestment, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, History, CheckCircle, Hourglass, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
    const { user, userData } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCanceling, setIsCanceling] = useState<string | null>(null);
    const [investmentToCancel, setInvestmentToCancel] = useState<ActiveInvestment | null>(null);
    const typedUserData = userData as User | null;

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

    const handleCancelInvestment = async () => {
        if (!user || !investmentToCancel || !firestore || !typedUserData) return;

        setIsCanceling(investmentToCancel.id);

        const batch = writeBatch(firestore);

        const investmentRef = doc(firestore, `users/${user.uid}/activeInvestments/${investmentToCancel.id}`);
        const userRef = doc(firestore, 'users', user.uid);
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));

        // 1. Refund the user's balance
        batch.update(userRef, {
            balance: increment(investmentToCancel.amount)
        });

        // 2. Create a transaction log for the refund
        batch.set(transactionRef, {
            type: 'investment_refund',
            amount: investmentToCancel.amount,
            date: serverTimestamp(),
            status: 'completed',
            userId: user.uid,
            username: typedUserData.username,
            userDisplayName: typedUserData.displayName,
            userEmail: typedUserData.email,
        });

        // 3. Delete the active investment
        batch.delete(investmentRef);

        try {
            await batch.commit();
            toast({
                title: 'Investment Canceled',
                description: `${formatCurrency(investmentToCancel.amount)} has been refunded to your balance.`,
            });
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: investmentRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Cancellation Failed',
                description: 'Could not cancel the investment. Please try again.',
            });
        } finally {
            setIsCanceling(null);
            setInvestmentToCancel(null);
        }
    };

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
                             <CardFooter>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => setInvestmentToCancel(inv)}
                                    disabled={isCanceling === inv.id}
                                >
                                    {isCanceling === inv.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Cancel Plan
                                </Button>
                            </CardFooter>
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
             <AlertDialog open={!!investmentToCancel} onOpenChange={(open) => !open && setInvestmentToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to cancel this investment?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. The investment amount of{' '}
                        <strong>{formatCurrency(investmentToCancel?.amount)}</strong> will be refunded to your main balance. You will forfeit any future daily profits from this plan.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Go Back</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelInvestment}>Confirm Cancellation</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
