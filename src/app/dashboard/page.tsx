
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { User, Transaction } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, Briefcase, ArrowRight, Wallet, Rocket, Users, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

function formatCurrency(amount: number | undefined) {
  if (typeof amount !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(timestamp: any) {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('en-US', {
             year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    return 'Invalid date';
}

function DashboardSkeleton() {
    return (
        <div className="flex-1 space-y-6 p-4 md:p-8">
            <div className="space-y-1">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                ))}
            </div>
            <Skeleton className="h-28 w-full" />
            <div className="grid gap-4 grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                           <div key={i} className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="ml-4 space-y-1">
                                    <Skeleton className="h-4 w-[150px]" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </div>
                                <Skeleton className="ml-auto h-4 w-[80px]" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function DashboardPage() {
  const { user, userData, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const typedUserData = userData as User | null;

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {typedUserData?.displayName?.split(' ')[0] ?? 'User'}!
            </h1>
            <p className="text-muted-foreground">Here's a summary of your account.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" asChild>
                <Link href="/dashboard/wallet?tab=deposit">
                    <Landmark className="mr-2 h-4 w-4" /> Deposit
                </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/dashboard/wallet?tab=withdraw">
                    <Wallet className="mr-2 h-4 w-4" /> Withdraw
                </Link>
            </Button>
             <Button variant="outline" asChild>
                <Link href="/dashboard/invest">
                   <Rocket className="mr-2 h-4 w-4" /> Invest
                </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/dashboard/team">
                    <Users className="mr-2 h-4 w-4" /> Team
                </Link>
            </Button>
        </div>

      <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-primary">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tracking-tight">
                {formatCurrency(typedUserData?.balance)}
            </p>
          </CardContent>
        </Card>

      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
             <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
                {formatCurrency(typedUserData?.totalDeposits)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
                {formatCurrency(typedUserData?.totalWithdrawals)}
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 grid-cols-1">
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
             <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                  {formatCurrency(0)}
              </div>
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/wallet?tab=history">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
           <Table>
            <TableBody>
              {(transactionsLoading && !transactions) && (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="p-2">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right p-2"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                ))
              )}
              {transactions?.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="p-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {tx.type === 'deposit' ? 
                          <TrendingUp className="h-5 w-5 text-green-500" /> : 
                          <TrendingDown className="h-5 w-5 text-red-500" />}
                      </div>
                      <div>
                        <div className="capitalize font-medium">{tx.type}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono p-2">
                      {tx.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
               {!transactionsLoading && transactions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
