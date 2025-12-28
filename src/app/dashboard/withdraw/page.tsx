
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Wallet, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { collection, addDoc, serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const MIN_WITHDRAWAL = 50;

const withdrawSchema = z.object({
    amount: z.coerce
        .number()
        .positive({ message: "Amount must be greater than 0." })
        .min(MIN_WITHDRAWAL, { message: `Minimum withdrawal amount is $${MIN_WITHDRAWAL}.` }),
    walletAddress: z.string().min(26, { message: "Please enter a valid crypto wallet address."}),
});


export default function WithdrawPage() {
    const { toast } = useToast();
    const { user, userData } = useUser();
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(false);

    const typedUserData = userData as User | null;

    const form = useForm<z.infer<typeof withdrawSchema>>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            amount: undefined,
            walletAddress: '',
        }
    });

    async function onSubmit(values: z.infer<typeof withdrawSchema>) {
        if(!user || !typedUserData || !firestore) return;

        if(values.amount > typedUserData.balance) {
            form.setError("amount", {
                type: "manual",
                message: "Withdrawal amount cannot exceed your balance.",
            });
            return;
        }

        setIsLoading(true);

        const newTransaction = {
            type: 'withdrawal' as const,
            amount: values.amount,
            walletAddress: values.walletAddress,
            status: 'pending' as const,
            date: serverTimestamp(),
        };

        const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
        
        addDoc(transactionsRef, newTransaction)
            .then(() => {
                toast({
                    title: 'Withdrawal Request Submitted',
                    description: `Your request to withdraw $${values.amount} has been received. It will be processed within 24 hours.`,
                });
                form.reset();
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: transactionsRef.path,
                    operation: 'create',
                    requestResourceData: newTransaction,
                });
                errorEmitter.emit('permission-error', permissionError);
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
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Request Withdrawal</CardTitle>
                    <CardDescription>Enter the amount and your USDT (TRC20) wallet address. Current balance: <strong>${typedUserData?.balance.toFixed(2) ?? '0.00'}</strong></CardDescription>
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
                            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full">
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
