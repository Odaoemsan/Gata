
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Copy, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { collection, addDoc, serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const usdtWallet = {
    name: 'Tether (USDT TRC20)',
    address: 'TXYZ12345AbcdeFGHiJkLmnOPqrstUVwxyZ12345',
};

export default function DepositPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCopy = (address: string) => {
        navigator.clipboard.writeText(address);
        toast({
            title: 'Copied!',
            description: 'Wallet address copied to clipboard.',
        });
    };

    const handleDepositRequest = () => {
        if (!user || !amount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter an amount.' });
            return;
        }
        if (!firestore) {
             toast({ variant: 'destructive', title: 'Error', description: 'Database connection not found.' });
            return;
        }

        setIsLoading(true);

        const newTransaction = {
            type: 'deposit' as const,
            amount: parseFloat(amount),
            status: 'pending' as const,
            date: serverTimestamp(),
        };

        const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
        
        addDoc(transactionsRef, newTransaction)
            .then(() => {
                toast({
                    title: 'Deposit Request Submitted',
                    description: `Your request to deposit $${amount} is under review. Your balance will be updated within 1-2 hours after confirmation.`,
                });
                setAmount('');
            })
            .catch(async (error) => {
                if (error.code === 'permission-denied') {
                    const docRef = error.customData?.docRef as DocumentReference | undefined;
                    const path = docRef ? docRef.path : transactionsRef.path;
                    const permissionError = new FirestorePermissionError({
                        path: path,
                        operation: 'create',
                        requestResourceData: newTransaction,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Request Failed',
                        description: 'Could not submit your deposit request. Please try again.',
                    });
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">1. Send USDT (TRC20)</CardTitle>
                    <CardDescription>Send the amount you wish to invest to the provided TRC20 wallet address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                        <h3 className="font-semibold text-center">Send to this {usdtWallet.name} address:</h3>
                        <div className="relative">
                            <Input
                                readOnly
                                value={usdtWallet.address}
                                className="pr-10 text-center font-mono text-sm break-all"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => handleCopy(usdtWallet.address)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
             <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">2. Confirm Your Deposit</CardTitle>
                    <CardDescription>After sending the funds, enter the amount and submit your request for manual review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="amount">Amount Sent (USD)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="100.00" 
                                className="pl-10 text-base" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button onClick={handleDepositRequest} disabled={!amount || isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Deposit Request
                    </Button>
                     <p className="text-xs text-muted-foreground text-center pt-2">
                        Deposits are reviewed manually and typically credited within 1-2 hours.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
