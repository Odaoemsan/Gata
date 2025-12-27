
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Copy, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from '@/firebase/auth/use-user';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const cryptoWallets = [
    { name: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
    { name: 'Ethereum (ETH)', address: '0x321a4DB2594532B94242B8b4c813399435754432' },
    { name: 'Tether (USDT)', address: '0x987b3A321f4A2b5C4D6E890B1234567890aBcDeF' },
];

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

    const handleDepositRequest = async () => {
        if (!user || !amount) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter an amount.' });
            return;
        }
        setIsLoading(true);

        try {
            const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
            await addDoc(transactionsRef, {
                type: 'deposit',
                amount: parseFloat(amount),
                status: 'pending',
                date: serverTimestamp(),
            });
            
            toast({
                title: 'Deposit Request Submitted',
                description: `Your request to deposit $${amount} is under review. Your balance will be updated within 1-2 hours after confirmation.`,
            });
            setAmount('');
        } catch (error) {
            console.error("Error creating deposit request: ", error);
            toast({
                variant: 'destructive',
                title: 'Request Failed',
                description: 'Could not submit your deposit request. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">1. Choose Crypto &amp; Send</CardTitle>
                    <CardDescription>Select a cryptocurrency and send the amount you wish to invest to the provided address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue={cryptoWallets[0].name} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            {cryptoWallets.map(wallet => (
                                <TabsTrigger key={wallet.name} value={wallet.name}>{wallet.name.split(' ')[0]}</TabsTrigger>
                            ))}
                        </TabsList>
                        {cryptoWallets.map(wallet => (
                        <TabsContent key={wallet.name} value={wallet.name}>
                            <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                                <h3 className="font-semibold text-center">Send to this {wallet.name} address:</h3>
                                <div className="relative">
                                    <Input
                                        readOnly
                                        value={wallet.address}
                                        className="pr-10 text-center font-mono text-sm"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                        onClick={() => handleCopy(wallet.address)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        ))}
                    </Tabs>
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
