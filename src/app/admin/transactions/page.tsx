
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  runTransaction,
  getDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import type { Transaction, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Copy, Check, X, User as UserIcon, Mail, Hash, Wallet, ArrowUpRight, ArrowDownLeft, Inbox, AtSign, Fingerprint } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function formatCurrency(amount: number) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  
function formatDate(timestamp: any) {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000 || timestamp);
    if(isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function RequestSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-5 w-full" />
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

function EmptyState({ message, icon }: { message: string, icon: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-4">
            {icon}
            <p className="mt-4 text-muted-foreground">{message}</p>
        </div>
    )
}


export default function TransactionsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingTransactions = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);

    try {
        const depositsQuery = query(
            collectionGroup(firestore, 'transactions'),
            where('type', '==', 'deposit'),
            where('status', '==', 'pending')
        );
        const withdrawalsQuery = query(
            collectionGroup(firestore, 'transactions'),
            where('type', '==', 'withdrawal'),
            where('status', '==', 'pending')
        );

        const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
            getDocs(depositsQuery),
            getDocs(withdrawalsQuery)
        ]);

        const pendingDeposits = depositsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path } as Transaction & {path: string}));
        const pendingWithdrawals = withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path } as Transaction & {path: string}));


        setDeposits(pendingDeposits);
        setWithdrawals(pendingWithdrawals);
    } catch (error) {
        console.error("Error fetching transactions: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch pending transactions.' });
    } finally {
        setLoading(false);
    }
  }, [firestore, toast]);

  
  useEffect(() => {
    fetchPendingTransactions();
  }, [fetchPendingTransactions]);


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const handleDeposit = async (tx: Transaction, approved: boolean) => {
      if (!firestore || !tx.userId) return;
      setProcessingId(tx.id);

      try {
        await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', tx.userId!);
            const txRef = doc(firestore, `users/${tx.userId}/transactions`, tx.id);
            
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found");
            }

            if (approved) {
                transaction.update(userRef, {
                    balance: increment(tx.amount),
                    totalDeposits: increment(tx.amount)
                });
                transaction.update(txRef, { status: 'completed' });
            } else {
                 transaction.update(txRef, { status: 'failed' });
            }
        });
        toast({ title: 'Success', description: `Deposit request has been ${approved ? 'approved' : 'rejected'}.` });
        fetchPendingTransactions();
      } catch (error) {
         console.error("Error processing deposit: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to process deposit.' });
      } finally {
        setProcessingId(null);
      }
  }

  const handleWithdrawal = async (tx: Transaction, approved: boolean) => {
      if (!firestore || !tx.userId) return;
      setProcessingId(tx.id);
      
      try {
          const userRef = doc(firestore, 'users', tx.userId);
          const txRef = doc(firestore, `users/${tx.userId}/transactions`, tx.id);
          
          if (approved) {
             await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User not found");
                }
                // On approval, we only update the totalWithdrawals and the transaction status.
                // The balance was already debited when the user made the request.
                transaction.update(userRef, {
                    totalWithdrawals: increment(tx.amount)
                });
                transaction.update(txRef, { status: 'completed' });
            });
             toast({ title: 'Success', description: `Withdrawal request has been completed.` });
          } else {
              // If rejected, return the funds to the user's balance and fail the transaction.
              await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User not found");
                }
                 transaction.update(userRef, {
                    balance: increment(tx.amount)
                });
                transaction.update(txRef, { status: 'failed' });
              });
              toast({ title: 'Success', description: `Withdrawal request has been rejected.` });
          }

          fetchPendingTransactions();
      } catch (error) {
        console.error("Error processing withdrawal: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to process withdrawal.' });
      } finally {
          setProcessingId(null);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Transactions</h2>
          <p className="text-muted-foreground">Review and process pending user deposits and withdrawals.</p>
        </div>
      </div>
      <Tabs defaultValue="deposits">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposits">
                Deposit Requests 
                <Badge className="ml-2">{deposits.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
                Withdrawal Requests
                <Badge className="ml-2">{withdrawals.length}</Badge>
            </TabsTrigger>
        </TabsList>
        <TabsContent value="deposits" className="mt-4">
            {loading ? <RequestSkeleton /> : (
                deposits.length > 0 ? (
                    <div className="space-y-4">
                        {deposits.map(tx => (
                            <Card key={tx.id} className="shadow-sm">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2"><ArrowUpRight className="text-green-500"/> Deposit Request</CardTitle>
                                            <CardDescription>
                                               Requested on {formatDate(tx.date)}
                                            </CardDescription>
                                        </div>
                                        <div className="font-bold text-2xl text-green-500">{formatCurrency(tx.amount)}</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground"><UserIcon size={16}/> <span>{tx.userDisplayName}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground"><Fingerprint size={16}/> <span>{tx.username}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground"><AtSign size={16}/> <span>{tx.userEmail}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Hash size={16}/>
                                        <span className="font-mono break-all">{tx.transactionId}</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(tx.transactionId!)}><Copy size={14} /></Button>
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleDeposit(tx, false)} disabled={processingId === tx.id}>
                                         {processingId === tx.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4"/>}
                                         Reject
                                    </Button>
                                    <Button size="sm" onClick={() => handleDeposit(tx, true)} disabled={processingId === tx.id}>
                                        {processingId === tx.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4"/>}
                                        Approve
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : <EmptyState message="No pending deposit requests." icon={<Inbox className="h-12 w-12 text-muted-foreground" />} />
            )}
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-4">
            {loading ? <RequestSkeleton /> : (
                withdrawals.length > 0 ? (
                     <div className="space-y-4">
                        {withdrawals.map(tx => (
                            <Card key={tx.id} className="shadow-sm">
                                <CardHeader>
                                     <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2"><ArrowDownLeft className="text-red-500"/> Withdrawal Request</CardTitle>
                                            <CardDescription>
                                               Requested on {formatDate(tx.date)}
                                            </CardDescription>
                                        </div>
                                        <div className="font-bold text-2xl text-red-500">{formatCurrency(tx.amount)}</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                     <div className="flex items-center gap-2 text-muted-foreground"><UserIcon size={16}/> <span>{tx.userDisplayName}</span></div>
                                     <div className="flex items-center gap-2 text-muted-foreground"><Fingerprint size={16}/> <span>{tx.username}</span></div>
                                     <div className="flex items-center gap-2 text-muted-foreground"><AtSign size={16}/> <span>{tx.userEmail}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Wallet size={16}/>
                                        <span className="font-mono break-all">{tx.walletAddress}</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(tx.walletAddress!)}><Copy size={14} /></Button>
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleWithdrawal(tx, false)} disabled={processingId === tx.id}>
                                         {processingId === tx.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4"/>}
                                        Reject
                                    </Button>
                                    <Button size="sm" onClick={() => handleWithdrawal(tx, true)} disabled={processingId === tx.id}>
                                        {processingId === tx.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4"/>}
                                        Complete
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : <EmptyState message="No pending withdrawal requests." icon={<Inbox className="h-12 w-12 text-muted-foreground" />} />
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
