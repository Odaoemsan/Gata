
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { collection, addDoc, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User, PendingTransaction } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const MIN_WITHDRAWAL = 50;
const REQUIRED_TRADES = 5;

// Function to create the schema with the user's balance
const createWithdrawSchema = (balance: number) => z.object({
    amount: z.coerce
        .number()
        .positive({ message: "Amount must be greater than 0." })
        .min(MIN_WITHDRAWAL, { message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}.` })
        .max(balance, { message: "Withdrawal amount cannot exceed your balance." }),
    walletAddress: z.string().min(26, { message: "Please enter a valid crypto wallet address."}),
});


export default function WithdrawPage() {
    const { toast } = useToast();
    const { user, userData, loading } = useUser();
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(false);

    const typedUserData = userData as User | null;
    const userBalance = typedUserData?.balance ?? 0;
    const dailyTradeCount = typedUserData?.dailyTradeCounter ?? 0;

    // Create the schema dynamically with the user's balance
    const withdrawSchema = createWithdrawSchema(userBalance);

    const form = useForm<z.infer<typeof withdrawSchema>>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            amount: '' as any,
            walletAddress: '',
        },
        mode: 'onChange', // Validate on change to provide immediate feedback
    });

    const watchAmount = form.watch('amount');
    const canWithdraw = dailyTradeCount >= REQUIRED_TRADES;

    async function onSubmit(values: z.infer<typeof withdrawSchema>) {
        if(!user || !typedUserData || !firestore || !canWithdraw) return;

        setIsLoading(true);

        const newRequest: Omit<PendingTransaction, 'id'> = {
            type: 'withdrawal',
            amount: values.amount,
            walletAddress: values.walletAddress,
            date: serverTimestamp(),
            userId: user.uid,
            username: typedUserData.username,
            userDisplayName: typedUserData.displayName,
            userEmail: typedUserData.email,
        };
        
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, 'users', user.uid);
        const pendingWithdrawalsRef = doc(collection(firestore, 'pendingWithdrawals'));

        // 1. Debit the user's balance
        batch.update(userRef, { 
            balance: increment(-values.amount),
            dailyTradeCounter: 0 // Reset the counter
        });
        // 2. Create the pending withdrawal request
        batch.set(pendingWithdrawalsRef, newRequest);
        
        batch.commit()
            .then(() => {
                toast({
                    title: 'Withdrawal Request Submitted',
                    description: `Your request to withdraw $${values.amount} has been received. It will be processed within 24 hours.`,
                });
                form.reset();
            })
            .catch(async (serverError) => {
                // Since this is a batch, we'll emit a general permission error.
                const permissionError = new FirestorePermissionError({
                    path: pendingWithdrawalsRef.path,
                    operation: 'create',
                    requestResourceData: newRequest,
                });
                errorEmitter.emit('permission-error', permissionError);

                 toast({
                    variant: 'destructive',
                    title: 'Withdrawal Failed',
                    description: 'Could not submit your request. Your balance has not been changed.',
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <div className="space-y-4">
             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">Withdrawal Rules</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Minimum withdrawal amount is <strong>${MIN_WITHDRAWAL}</strong>.</p>
                    <p>• Withdrawals are processed manually within 3 business days.</p>
                    <p>• A 5% fee applies to all withdrawals.</p>
                    <p>• Withdrawals are available every 5 daily trading days.</p>
                </CardContent>
            </Card>

            {!canWithdraw && !loading && (
                 <Card className="border-destructive/50 bg-destructive/10 text-destructive">
                     <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                         <AlertCircle className="h-5 w-5"/>
                         <CardTitle className="text-lg">Withdrawal Locked</CardTitle>
                     </CardHeader>
                    <CardContent>
                        <p>You need to claim daily profits for <strong>{REQUIRED_TRADES - dailyTradeCount}</strong> more day(s) to be able to withdraw.</p>
                    </CardContent>
                 </Card>
            )}

            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Request Withdrawal</CardTitle>
                    <CardDescription>Enter the amount and your USDT (TRC20) wallet address. Current balance: <strong>${userBalance.toFixed(2)}</strong></CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label htmlFor="amount">Amount to Withdraw (USD)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="amount"
                                                type="number"
                                                placeholder="100.00"
                                                className="pl-10"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="walletAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label htmlFor="walletAddress">Your Crypto Wallet Address (USDT TRC20)</Label>
                                        <div className="relative">
                                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="walletAddress"
                                                placeholder="Enter your USDT TRC20 wallet address"
                                                className="pl-10"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading || !form.formState.isValid || loading || !canWithdraw} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Withdrawal Request
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
