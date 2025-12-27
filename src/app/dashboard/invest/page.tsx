
'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Zap, Crown, CheckCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { InvestmentPlan, User } from '@/lib/types';


function PlanSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-4/5" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

export default function InvestPage() {
    const firestore = useFirestore();
    const { userData } = useUser();
    const { toast } = useToast();
    const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const plansQuery = query(collection(firestore, 'investmentPlans'));
    const { data: plans, loading } = useCollection<InvestmentPlan>(plansQuery);

    const typedUserData = userData as User | null;

    const planIcons = {
        default: <Rocket className="h-10 w-10 text-primary" />,
        starter: <Rocket className="h-10 w-10 text-primary" />,
        advanced: <Zap className="h-10 w-10 text-yellow-500" />,
        professional: <Crown className="h-10 w-10 text-purple-500" />
    };

    const handleInvest = () => {
        setIsLoading(true);
        const investmentAmount = parseFloat(amount);
        if (!selectedPlan || !typedUserData || !investmentAmount) {
            toast({ variant: "destructive", title: "Error", description: "Invalid plan or amount."});
            setIsLoading(false);
            return;
        }

        if (typedUserData.balance < investmentAmount) {
            toast({ variant: "destructive", title: "Insufficient Balance", description: "You do not have enough funds to make this investment."});
            setIsLoading(false);
            return;
        }
        
        // This is where you would trigger a Firebase function to handle the investment logic
        // to ensure atomicity (deduct balance, create investment record).
        // For now, we simulate success.
        console.log(`Investing ${investmentAmount} in ${selectedPlan.name}`);

        setTimeout(() => {
            toast({
                title: "Investment Successful!",
                description: `You have successfully invested $${investmentAmount} in the ${selectedPlan.name} plan.`
            });
            setIsLoading(false);
            setSelectedPlan(null);
            setAmount('');
        }, 2000);
    }
    
    return (
        <div className="flex-1 space-y-6 p-4 md:p-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
                <p className="text-muted-foreground mt-1">Select a plan that suits your financial goals.</p>
            </div>
            
            {loading ? <PlanSkeleton /> : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(plans ?? []).map(plan => (
                        <Card key={plan.id} className="shadow-lg hover:shadow-primary/20 transition-shadow flex flex-col">
                             <CardHeader>
                                <div className="flex items-center gap-4">
                                     {planIcons[plan.name.toLowerCase() as keyof typeof planIcons] || planIcons.default}
                                    <div>
                                        <CardTitle className="text-xl font-headline">{plan.name}</CardTitle>
                                        <CardDescription>Min/Max: ${plan.minMax}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 flex-grow">
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                    <span><strong>{plan.dailyProfit}%</strong> Daily Profit</span>
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                    <span><strong>{plan.duration} Days</strong> Duration</span>
                                </div>
                                 <div className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                    <span>Principal returned at end</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => setSelectedPlan(plan)}>Choose Plan</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            <AlertDialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Invest in {selectedPlan?.name} Plan</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the amount you wish to invest. Your current balance is <strong>${typedUserData?.balance.toFixed(2) ?? '0.00'}</strong>.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                         <Label htmlFor="investment-amount">Amount (USD)</Label>
                         <Input 
                            id="investment-amount" 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Min/Max: ${selectedPlan?.minMax}`} />
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleInvest} disabled={isLoading || !amount}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Investment
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
