
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

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

    const form = useForm<z.infer<typeof withdrawSchema>>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            amount: undefined,
            walletAddress: '',
        }
    });

    async function onSubmit(values: z.infer<typeof withdrawSchema>) {
        if(!user || !userData || !firestore) return;

        if(values.amount > userData.balance) {
            form.setError("amount", {
                type: "manual",
                message: "Withdrawal amount cannot exceed your balance.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
            await addDoc(transactionsRef, {
                type: 'withdrawal',
                amount: values.amount,
                walletAddress: values.walletAddress,
                status: 'pending',
                date: serverTimestamp(),
            });

            toast({
                title: 'Withdrawal Request Submitted',
                description: `Your request to withdraw $${values.amount} has been received. It will be processed within 24 hours.`,
            });
            form.reset();
        } catch (error) {
            console.error("Error creating withdrawal request: ", error);
            toast({
                variant: 'destructive',
                title: 'Request Failed',
                description: 'Could not submit your withdrawal request. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-4">
             <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">Withdrawal Rules</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Minimum withdrawal amount is <strong>${MIN_WITHDRAWAL}</strong>.</p>
                    <p>• Withdrawals are permitted once every 5 days.</p>
                    <p>• Requests are processed manually within 24 business hours.</p>
                    <p>• A 5% fee applies to all withdrawals.</p>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Request Withdrawal</CardTitle>
                    <CardDescription>Enter the amount and your USDT wallet address.</CardDescription>
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
                                        <Label htmlFor="walletAddress">Your Crypto Wallet Address (USDT)</Label>
                                        <div className="relative">
                                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="walletAddress"
                                                placeholder="Enter your USDT wallet address"
                                                className="pl-10"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full">
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

    