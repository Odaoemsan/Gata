
'use client';

import { useMemo, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DepositPage from "../deposit/page";
import WithdrawPage from "../withdraw/page";
import { useUser } from "@/firebase/auth/use-user";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, orderBy, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Transaction, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from "lucide-react";
import React from "react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(timestamp: any) {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return 'Invalid date';
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
    const variant = {
        pending: 'default',
        completed: 'secondary',
        failed: 'destructive'
    }[status] as "default" | "secondary" | "destructive" | "outline" | null | undefined;
    
    const icon = {
        pending: <Clock className="mr-1 h-3 w-3" />,
        completed: <CheckCircle className="mr-1 h-3 w-3" />,
        failed: <XCircle className="mr-1 h-3 w-3" />
    }[status]

    return (
        <Badge variant={variant} className="capitalize flex items-center w-fit ml-auto sm:ml-0">
            {icon}
            {status}
        </Badge>
    );
}

function AllTransactions() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
        collection(firestore, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const { data: transactions, loading } = useCollection<Transaction>(transactionsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A complete record of all your deposits and withdrawals.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="hidden sm:table-cell text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading && (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                <TableCell className="hidden sm:table-cell text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    )}
                    {!loading && transactions?.map(tx => (
                        <TableRow key={tx.id}>
                        <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full">
                                {tx.type === 'deposit' ? 
                                <TrendingUp className="h-5 w-5 text-green-500" /> : 
                                <TrendingDown className="h-5 w-5 text-red-500" />}
                            </div>
                            <div>
                                <div className="capitalize font-medium">{tx.type}</div>
                                <div className="text-xs text-muted-foreground">{formatDate(tx.date)}</div>
                                <div className="sm:hidden mt-1"><StatusBadge status={tx.status} /></div>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className={cn(
                            "text-right font-mono font-semibold",
                            tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                        )}>
                            {tx.type === 'deposit' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                        </TableCell>
                         <TableCell className="hidden sm:table-cell text-right"><StatusBadge status={tx.status} /></TableCell>
                        </TableRow>
                    ))}
                    {!loading && transactions?.length === 0 && (
                        <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No transactions found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function WalletPageContent() {
    const { userData, loading } = useUser();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'deposit';
    const typedUserData = userData as User | null;

    return (
         <div className="flex-1 space-y-6 p-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">My Wallet</h2>
                <p className="text-muted-foreground mt-1">Manage your funds and view your transaction history.</p>
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
                            {typedUserData ? formatCurrency(typedUserData.balance) : formatCurrency(0)}
                        </p>
                    )}
                </CardContent>
            </Card>
            <Tabs defaultValue={defaultTab} className="max-w-2xl mx-auto pt-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="deposit">Deposit</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="deposit">
                   <DepositPage />
                </TabsContent>
                <TabsContent value="withdraw">
                   <WithdrawPage />
                </TabsContent>
                 <TabsContent value="history">
                   <AllTransactions />
                </TabsContent>
            </Tabs>
         </div>
    )
}


export default function WalletPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WalletPageContent />
        </Suspense>
    )
}
