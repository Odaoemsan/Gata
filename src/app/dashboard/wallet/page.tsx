'use client';

import { useMemo, Suspense, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DepositPage from "../deposit/page";
import WithdrawPage from "../withdraw/page";
import { useUser } from "@/firebase/auth/use-user";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, orderBy, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Transaction, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, ArrowRight, Copy } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(timestamp: any, includeTime = true) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000 || timestamp);
    if(isNaN(date.getTime())) return 'Invalid Date';

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return date.toLocaleString('en-US', options);
}

function StatusBadge({ status, className }: { status: Transaction['status'], className?: string }) {
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

    const textClass = {
        pending: '',
        completed: 'text-green-600 dark:text-green-400',
        failed: ''
    }[status]

    return (
        <Badge variant={variant} className={cn("capitalize flex items-center w-fit", textClass, className)}>
            {icon}
            {status}
        </Badge>
    );
}

function AllTransactions() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const { toast } = useToast();

    const transactionsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
        collection(firestore, 'users', user.uid, 'transactions'),
        orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const { data: transactions, loading } = useCollection<Transaction>(transactionsQuery);

    const handleCopy = (text: string | undefined) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    return (
        <>
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
                                <TableHead className="hidden sm:table-cell text-right pr-4">Status</TableHead>
                                <TableHead className="hidden sm:table-cell"></TableHead>
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
                                    <TableCell className="hidden sm:table-cell text-right pr-4"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-4 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        )}
                        {!loading && transactions?.map(tx => (
                            <TableRow key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer">
                            <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                    {tx.type === 'deposit' ? 
                                    <TrendingUp className="h-5 w-5 text-green-500" /> : 
                                    <TrendingDown className="h-5 w-5 text-red-500" />}
                                </div>
                                <div>
                                    <div className="capitalize font-medium">{tx.type}</div>
                                    <div className="text-xs text-muted-foreground">{formatDate(tx.date, true)}</div>
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
                            <TableCell className="hidden sm:table-cell text-right pr-4"><StatusBadge status={tx.status} /></TableCell>
                             <TableCell className="hidden sm:table-cell text-right w-12"><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                            </TableRow>
                        ))}
                        {!loading && transactions?.length === 0 && (
                            <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No transactions found.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {selectedTx && (
                 <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-center text-xl capitalize">{selectedTx.type} Details</DialogTitle>
                        </DialogHeader>
                        <Card className="border-none shadow-none">
                            <CardContent className="p-0 text-center space-y-2">
                                <p className={cn(
                                    "text-4xl font-bold tracking-tight",
                                    selectedTx.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {selectedTx.type === 'deposit' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                                </p>
                                <p className="text-sm font-medium text-muted-foreground">USDT</p>
                                <div className="flex justify-center">
                                    <StatusBadge status={selectedTx.status} className="text-base px-4 py-1" />
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-4 p-0 pt-6 mt-6 border-t">
                                <div className="w-full flex justify-between text-sm">
                                    <span className="text-muted-foreground">Time</span>
                                    <span className="font-medium">{formatDate(selectedTx.date, true)}</span>
                                </div>
                                 <div className="w-full flex justify-between text-sm">
                                    <span className="text-muted-foreground">Network</span>
                                    <span className="font-medium">USDT (TRC20)</span>
                                </div>
                                {selectedTx.type === 'withdrawal' && selectedTx.walletAddress && (
                                     <div className="w-full flex justify-between items-start text-sm gap-4">
                                        <span className="text-muted-foreground">To Address</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono break-all text-right">{selectedTx.walletAddress}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(selectedTx.walletAddress)}>
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {selectedTx.type === 'deposit' && selectedTx.transactionId && (
                                     <div className="w-full flex justify-between items-start text-sm gap-4">
                                        <span className="text-muted-foreground">TXID</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono break-all text-right">{selectedTx.transactionId}</span>
                                             <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(selectedTx.transactionId)}>
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" className="w-full">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogContent>
                </Dialog>
            )}
        </>
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
