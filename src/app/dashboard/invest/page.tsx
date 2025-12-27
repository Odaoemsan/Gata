
'use client';

import { useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Zap, Crown, CheckCircle, Loader2, PackageOpen, ArrowLeft } from 'lucide-react';
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
import type { InvestmentPlan, User, ActiveInvestment } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';


function PlanSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    <CardContent className="space-y-3">
                         <Skeleton className="h-5 w-4/5" />
                         <Skeleton className="h-5 w-full" />
                         <Skeleton className="h-5 w-3/4" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

function EmptyPlans() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">لا توجد خطط استثمارية متاحة</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
                يبدو أنه لا توجد خطط مفعلة من قبل الإدارة في الوقت الحالي. يرجى التحقق مرة أخرى في وقت لاحق.
            </p>
            <Button asChild className="mt-6">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    العودة إلى لوحة التحكم
                </Link>
            </Button>
        </div>
    )
}

export default function InvestPage() {
    const firestore = useFirestore();
    const { user, userData } = useUser();
    const { toast } = useToast();
    const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const plansQuery = firestore ? query(collection(firestore, 'investmentPlans')) : null;
    const { data: plans, loading } = useCollection<InvestmentPlan>(plansQuery);

    const typedUserData = userData as User | null;

    const planIcons: { [key: string]: JSX.Element } = {
        starter: <Rocket className="h-10 w-10 text-primary" />,
        advanced: <Zap className="h-10 w-10 text-yellow-500" />,
        professional: <Crown className="h-10 w-10 text-purple-500" />,
        default: <Rocket className="h-10 w-10 text-muted-foreground" />,
    };

    const handleInvest = async () => {
        setIsLoading(true);
        const investmentAmount = parseFloat(amount);
        if (!selectedPlan || !user || !typedUserData || !investmentAmount || !firestore) {
            toast({ variant: "destructive", title: "Error", description: "Invalid plan, user, or amount."});
            setIsLoading(false);
            return;
        }

        if (typedUserData.balance < investmentAmount) {
            toast({ variant: "destructive", title: "Insufficient Balance", description: "You do not have enough funds to make this investment."});
            setIsLoading(false);
            return;
        }

        const userRef = doc(firestore, "users", user.uid);
        const newInvestmentRef = doc(collection(firestore, `users/${user.uid}/activeInvestments`));
        
        const newBalance = typedUserData.balance - investmentAmount;
        
        const investmentStartDate = serverTimestamp();
        const investmentEndDate = new Date();
        investmentEndDate.setDate(investmentEndDate.getDate() + selectedPlan.duration);

        const newInvestment: Omit<ActiveInvestment, 'id'> = {
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            amount: investmentAmount,
            startDate: investmentStartDate,
            endDate: investmentEndDate,
            status: 'active',
        };

        const batch = writeBatch(firestore);
        
        batch.update(userRef, { balance: newBalance });
        batch.set(newInvestmentRef, newInvestment);

        batch.commit()
            .then(() => {
                toast({
                    title: "Investment Successful!",
                    description: `You have successfully invested $${investmentAmount} in the ${selectedPlan.name} plan.`
                });
                setSelectedPlan(null);
                setAmount('');
            })
            .catch(async (error) => {
                 const permissionError = new FirestorePermissionError({
                    path: userRef.path, // We assume the user balance update is the primary point of failure for permissions
                    operation: 'update',
                    requestResourceData: { balance: newBalance, investmentAmount: investmentAmount, _comment: 'Attempting to deduct investment amount' },
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }
    
    return (
        <div className="flex-1 space-y-6 p-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">اختر خطتك الاستثمارية</h2>
                <p className="text-muted-foreground mt-1">اختر الخطة التي تناسب أهدافك المالية.</p>
            </div>
            
            {loading ? <PlanSkeleton /> : (
                (!plans || plans.length === 0) ? <EmptyPlans /> : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map(plan => (
                            <Card key={plan.id} className="shadow-lg hover:shadow-primary/20 transition-shadow flex flex-col group">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        {planIcons[plan.name.toLowerCase()] || planIcons.default}
                                        <div>
                                            <CardTitle className="text-xl font-headline">{plan.name}</CardTitle>
                                            <CardDescription>الحد الأدنى/الأقصى: {plan.minMax}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 flex-grow">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-500 ml-3" />
                                        <span><strong>{plan.dailyProfit}%</strong> ربح يومي</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-500 ml-3" />
                                        <span><strong>{plan.duration} أيام</strong> المدة</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-green-500 ml-3" />
                                        <span>يتم إرجاع رأس المال في النهاية</span>
                                    </div>

                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full transition-transform group-hover:scale-105" onClick={() => setSelectedPlan(plan)}>
                                        استثمر الآن
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )
            )}
            
            <AlertDialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>استثمر في خطة {selectedPlan?.name}</AlertDialogTitle>
                    <AlertDialogDescription>
                        رصيدك الحالي هو <strong>${typedUserData?.balance.toFixed(2) ?? '0.00'}</strong>. 
                        أدخل المبلغ الذي ترغب في استثماره.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                         <Label htmlFor="investment-amount">المبلغ (بالدولار الأمريكي)</Label>
                         <Input 
                            id="investment-amount" 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`مثال: 500. الحد الأدنى/الأقصى: ${selectedPlan?.minMax}`} />
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleInvest} disabled={isLoading || !amount}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        تأكيد الاستثمار
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
    
