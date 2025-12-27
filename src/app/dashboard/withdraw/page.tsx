
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

const withdrawSchema = z.object({
    amount: z.coerce.number().positive({ message: "Amount must be greater than 0." }),
    walletAddress: z.string().min(26, { message: "Please enter a valid wallet address."}),
});


export default function WithdrawPage() {
    const { toast } = useToast();
    const { userData } = useUser();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof withdrawSchema>>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            amount: 0,
            walletAddress: '',
        }
    });

    function onSubmit(values: z.infer<typeof withdrawSchema>) {
        if(userData && values.amount > userData.balance) {
            form.setError("amount", {
                type: "manual",
                message: "Withdrawal amount cannot exceed your balance.",
            });
            return;
        }

        setIsLoading(true);
        // Here you would typically interact with a backend or Firebase function
        // to create a pending withdrawal transaction.
        setTimeout(() => {
            toast({
                title: 'Withdrawal Request Submitted',
                description: `Your request to withdraw $${values.amount} has been received. It will be processed within 24 hours.`,
            });
            setIsLoading(false);
            form.reset();
        }, 2000);
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Withdraw Funds</h2>
                <p className="text-muted-foreground mt-1">Request a withdrawal to your crypto wallet.</p>
            </div>
             <Card className="max-w-2xl mx-auto bg-muted/50">
                <CardHeader>
                    <CardTitle>Your Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Current Balance:</span>
                        <span className="font-bold text-lg">{userData ? `$${userData.balance.toFixed(2)}` : '$0.00'}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Withdrawal Fee:</span>
                        <span className="font-bold text-lg">5%</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-2xl mx-auto">
                 <CardHeader>
                    <CardTitle>Withdrawal Details</CardTitle>
                    <CardDescription>Enter the amount and your wallet address.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label htmlFor="amount">Amount (USD)</Label>
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
                                                placeholder="bc1q..."
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
                                Request Withdrawal
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardHeader>
                    <p className="text-xs text-muted-foreground pt-4">
                        Please double-check your wallet address. Transactions to incorrect addresses cannot be recovered. Withdrawals are processed manually and may take up to 24 hours.
                    </p>
                </CardHeader>
            </Card>
        </div>
    );
}
