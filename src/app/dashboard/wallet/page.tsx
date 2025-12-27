
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DepositPage from "../deposit/page";
import WithdrawPage from "../withdraw/page";
import { useUser } from "@/firebase/auth/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function WalletPage() {
    const { userData, loading } = useUser();

    return (
         <div className="flex-1 space-y-6 p-4 md:p-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">My Wallet</h2>
                <p className="text-muted-foreground mt-1">Manage your deposits and withdrawals.</p>
            </div>
             <Card className="max-w-2xl mx-auto bg-primary/5 dark:bg-primary/10 border-primary/20">
                <CardHeader className="pb-4 text-center">
                    <CardTitle className="text-sm font-medium text-primary">Total Balance</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    {loading ? (
                        <Skeleton className="h-10 w-48 mx-auto" />
                    ) : (
                        <p className="text-4xl font-bold tracking-tight">
                            {userData ? formatCurrency(userData.balance) : formatCurrency(0)}
                        </p>
                    )}
                </CardContent>
            </Card>
            <Tabs defaultValue="deposit" className="max-w-2xl mx-auto pt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit">Deposit</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>
                <TabsContent value="deposit">
                   <DepositPage />
                </TabsContent>
                <TabsContent value="withdraw">
                   <WithdrawPage />
                </TabsContent>
            </Tabs>
         </div>
    )
}
