
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
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User, PendingTransaction } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const MIN_WITHDRAWAL = 50;

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

    async function onSubmit(values: z.infer<typeof withdrawSchema>) {
        if(!user || !typedUserData || !firestore) return;

        // The schema validation already handles this, but as a safeguard:
        if(values.amount > typedUserData.balance) {
            form.setError("amount", {
                type: "manual",
                message: "Withdrawal amount cannot exceed your balance.",
            });
            return;
        }

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
        
        // Debit the user's balance immediately
        const userRef = doc(firestore, 'users', user.uid);
        const newBalance = typedUserData.balance - values.amount;
        batch.update(userRef, { balance: newBalance });

        // Create the pending withdrawal request for the admin
        const pendingWithdrawalsRef = collection(firestore, 'pendingWithdrawals');
        const newRequestRef = doc(pendingWithdrawalsRef);
        batch.set(newRequestRef, newRequest);
        
        batch.commit()
            .then(() => {
                toast({
                    title: 'Withdrawal Request Submitted',
                    description: `Your request to withdraw $${values.amount} has been received. It will be processed within 24 hours.`,
                });
                form.reset();
            })
            .catch(async (serverError) => {
                 // Re-credit user balance if commit fails
                const userRef = doc(firestore, 'users', user.uid);
                await addDoc(collection(firestore, `users/${user.uid}/transactions`), {
                    ...newRequest,
                    status: 'failed',
                    type: 'withdrawal',
                    date: serverTimestamp()
                });
                await writeBatch(firestore).update(userRef, { balance: typedUserData.balance }).commit();

                const permissionError = new FirestorePermissionError({
                    path: pendingWithdrawalsRef.path,
                    operation: 'create',
                    requestResourceData: newRequest,
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
                            <Button type="submit" disabled={isLoading || !form.formState.isValid || loading} className="w-full">
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
