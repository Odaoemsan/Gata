
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { doc, writeBatch, serverTimestamp, increment, collection, where, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CircleDollarSign, Loader2, Hourglass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActiveInvestment, User, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import Link from 'next/link';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const COOLDOWN_HOURS = 24;

const SIMULATION_STEPS = [
    { message: 'Connecting to market...', color: 'text-blue-400' },
    { message: 'Analyzing trends...', color: 'text-yellow-400' },
    { message: 'Executing trades...', color: 'text-orange-400' },
    { message: 'Securing profits...', color: 'text-purple-400' },
    { message: 'Finalizing...', color: 'text-green-400' },
];

function CountdownTimer({ targetDate }: { targetDate: Date }) {
    const calculateTimeLeft = () => {
        const difference = targetDate.getTime() - new Date().getTime();
        let timeLeft = { hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeft = {
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });
    
    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="text-2xl md:text-4xl font-mono tracking-tighter">
            <span>{pad(timeLeft.hours)}</span>:
            <span>{pad(timeLeft.minutes)}</span>:
            <span>{pad(timeLeft.seconds)}</span>
        </div>
    );
}

export default function DailyProfitPage() {
    const { user, userData, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isReady, setIsReady] = useState(false);
    const [nextTradeTime, setNextTradeTime] = useState<Date | null>(null);
    const [isTrading, setIsTrading] = useState(false);
    const [simulationStep, setSimulationStep] = useState(0);
    const [simulationDialogOpen, setSimulationDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const typedUserData = userData as User | null;

    const activeInvestmentsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/activeInvestments`), where('status', '==', 'active'));
    }, [user, firestore]);

    const { data: activeInvestments, loading: investmentsLoading } = useCollection<ActiveInvestment>(activeInvestmentsQuery);

    useEffect(() => {
        if (userLoading || investmentsLoading || !typedUserData) return;

        const lastTrade = typedUserData?.lastTradeTime?.toDate();
        if (lastTrade) {
            const nextTime = new Date(lastTrade.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
            setNextTradeTime(nextTime);
            setIsReady(new Date() > nextTime);
        } else {
            setIsReady(true);
        }
    }, [typedUserData, userLoading, investmentsLoading]);
    
    const startSimulation = () => {
        setSimulationDialogOpen(true);
        setIsTrading(true);
        setSimulationStep(0);
        
        const interval = setInterval(() => {
            setSimulationStep(prev => {
                if (prev >= SIMULATION_STEPS.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setSimulationDialogOpen(false);
                        setIsTrading(false);
                    }, 1000); 
                    return prev;
                }
                return prev + 1;
            });
        }, 2000); // 2 seconds per step
    }

    const handleTrade = async () => {
        if (!user || !firestore || !activeInvestments || activeInvestments.length === 0 || !typedUserData) {
            toast({
                variant: 'destructive',
                title: 'No Active Investments',
                description: 'You must have an active investment to collect daily profits.',
            });
            return;
        }

        setConfirmDialogOpen(false); // Close confirmation dialog
        setIsTrading(true); // Disable buttons while processing

        const totalDailyProfit = activeInvestments.reduce((sum, inv) => sum + (inv.dailyProfit / 100) * inv.amount, 0);

        const userRef = doc(firestore, 'users', user.uid);
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        
        const newTransactionData = {
            type: 'daily_profit',
            amount: totalDailyProfit,
            date: serverTimestamp(),
            status: 'completed',
            userId: user.uid,
            username: typedUserData.username,
            userDisplayName: typedUserData.displayName,
            userEmail: typedUserData.email,
        };

        const batch = writeBatch(firestore);
        batch.update(userRef, { 
            balance: increment(totalDailyProfit),
            lastTradeTime: serverTimestamp(),
            dailyTradeCounter: increment(1) 
        });
        batch.set(transactionRef, newTransactionData);

        try {
            await batch.commit();
            
            toast({
                title: "Profit Claimed!",
                description: `${formatCurrency(totalDailyProfit)} has been added to your balance.`,
            });
            
            const nextTime = new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000);
            setNextTradeTime(nextTime);
            setIsReady(false);

            // Start visual simulation AFTER successful DB write
            startSimulation();
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { balance: increment(totalDailyProfit), lastTradeTime: serverTimestamp(), dailyTradeCounter: increment(1) }
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error Claiming Profit',
                description: 'There was an issue processing your profit. Please try again.',
            });
            setIsTrading(false); // Re-enable on error
        }
    };
    
    const isLoading = userLoading || investmentsLoading;
    const canTrade = isReady && !isLoading && activeInvestments && activeInvestments.length > 0;
    const noInvestments = !isLoading && (!activeInvestments || activeInvestments.length === 0);

    return (
        <div className="flex-1 space-y-6 p-4">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Daily Profit</h2>
                <p className="text-muted-foreground mt-1">Claim your profits from active investments once every 24 hours.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="items-center text-center">
                    <CircleDollarSign className="h-16 w-16 text-primary" />
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-48 mx-auto" />
                            <Skeleton className="h-12 w-3/4 mx-auto" />
                        </div>
                    ) : canTrade ? (
                        <>
                            <CardTitle className="text-2xl">Ready to Collect</CardTitle>
                            <p className="text-muted-foreground">Your daily profit is available. Start the process to add it to your balance.</p>
                            <Button size="lg" className="w-full" onClick={() => setConfirmDialogOpen(true)} disabled={isTrading}>
                               {isTrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Claim Now
                            </Button>
                        </>
                    ) : noInvestments ? (
                        <>
                             <CardTitle className="text-2xl">No Active Investments</CardTitle>
                             <p className="text-muted-foreground">You need an active investment to be able to claim daily profits.</p>
                             <Button size="lg" className="w-full" asChild>
                                <Link href="/dashboard/invest">Make an Investment</Link>
                             </Button>
                        </>
                    ) : (
                         <>
                            <CardTitle className="text-2xl">Next Profit Available In</CardTitle>
                            {nextTradeTime && <CountdownTimer targetDate={nextTradeTime} />}
                            <Button size="lg" className="w-full" disabled>
                               <Hourglass className="mr-2 h-4 w-4"/> On Cooldown
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="sm:max-w-md text-center" hideCloseButton={isTrading}>
                     <DialogHeader>
                        <DialogTitle className="text-2xl">Initiate Daily Trade</DialogTitle>
                        <DialogDescription>
                            Confirm to start the automated trading process and claim your daily profit.
                        </DialogDescription>
                     </DialogHeader>
                     <div className="flex flex-col gap-4 py-4">
                         <Button size="lg" onClick={handleTrade} disabled={isTrading}>
                            {isTrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Confirm & Trade
                         </Button>
                         <Button size="lg" variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isTrading}>Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={simulationDialogOpen} onOpenChange={setSimulationDialogOpen}>
                 <DialogContent className="sm:max-w-md text-center" hideCloseButton>
                     <DialogHeader>
                        <DialogTitle className="text-2xl">Processing...</DialogTitle>
                     </DialogHeader>
                    <div className="py-8 space-y-4">
                        <div className="relative flex justify-center items-center">
                            <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            <CircleDollarSign className="h-8 w-8 absolute text-primary"/>
                        </div>
                        <p className={`text-lg font-semibold transition-colors duration-500 ${SIMULATION_STEPS[simulationStep]?.color || 'text-muted-foreground'}`}>
                            {SIMULATION_STEPS[simulationStep]?.message || 'Please wait...'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
