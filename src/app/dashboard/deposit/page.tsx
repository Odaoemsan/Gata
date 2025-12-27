
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Copy, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const cryptoWallets = [
    { name: 'Bitcoin (BTC)', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
    { name: 'Ethereum (ETH)', address: '0x321a4DB2594532B94242B8b4c813399435754432' },
    { name: 'Tether (USDT)', address: '0x987b3A321f4A2b5C4D6E890B1234567890aBcDeF' },
];

export default function DepositPage() {
    const { toast } = useToast();
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
        setIsLoading(true);
        // Here you would typically interact with a backend or Firebase function
        // to create a pending transaction record.
        setTimeout(() => {
            toast({
                title: 'Deposit Request Submitted',
                description: `Your request to deposit ${amount}$ has been noted. Please send the funds to the selected wallet.`,
            });
            setIsLoading(false);
            setAmount('');
        }, 1500);
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Deposit Funds</h2>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Make a Deposit</CardTitle>
                    <CardDescription>Choose a cryptocurrency and send the amount you wish to invest.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="100.00" 
                                className="pl-10" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    
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
                                <p className="text-xs text-muted-foreground text-center">
                                    Once sent, your balance will be updated after network confirmation. 
                                    Make sure to submit your deposit request below.
                                </p>
                            </div>
                        </TabsContent>
                        ))}
                    </Tabs>

                    <Button onClick={handleDepositRequest} disabled={!amount || isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Deposit Request
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
