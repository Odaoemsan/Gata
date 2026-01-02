
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  getDocs,
  doc,
  writeBatch,
  increment,
  Timestamp,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import type { PendingTransaction } from '@/lib/types';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatCurrency, formatDate } from '@/lib/formatters';


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

  const [deposits, setDeposits] = useState<PendingTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingTransactions = useCallback(async () => {
    if (!firestore) return;
    setLoading(true);

    try {
        const depositsQuery = query(collection(firestore, 'pendingDeposits'));
        const withdrawalsQuery = query(collection(firestore, 'pendingWithdrawals'));

        const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
            getDocs(depositsQuery).catch(error => {
                 const permissionError = new FirestorePermissionError({ path: 'pendingDeposits', operation: 'list' });
                 errorEmitter.emit('permission-error', permissionError);
                 throw error;
            }),
            getDocs(withdrawalsQuery).catch(error => {
                 const permissionError = new FirestorePermissionError({ path: 'pendingWithdrawals', operation: 'list' });
                 errorEmitter.emit('permission-error', permissionError);
                 throw error;
            })
        ]);

        const pendingDeposits = depositsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingTransaction));
        const pendingWithdrawals = withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingTransaction));

        setDeposits(pendingDeposits);
        setWithdrawals(pendingWithdrawals);
    } catch (error: any) {
        // Errors are now handled by the emitter, no need for a user-facing toast here in dev.
        console.error("Failed to fetch pending transactions:", error);
    } finally {
        setLoading(false);
    }
  }, [firestore]);

  
  useEffect(() => {
    if (firestore) {
        fetchPendingTransactions();
    }
  }, [firestore, fetchPendingTransactions]);


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const handleDeposit = async (tx: PendingTransaction, approved: boolean) => {
      if (!firestore || !tx.userId) return;
      setProcessingId(tx.id);

      const batch = writeBatch(firestore);
      const pendingRef = doc(firestore, 'pendingDeposits', tx.id);
      const permanentTxRef = doc(collection(firestore, `users/${tx.userId}/transactions`));
      
      const permanentTxData = {
        type: tx.type,
        amount: tx.amount,
        date: serverTimestamp(),
        status: approved ? 'completed' : 'failed',
        transactionId: tx.transactionId,
        userId: tx.userId,
        username: tx.username,
        userDisplayName: tx.userDisplayName,
        userEmail: tx.userEmail,
      };

      if (approved) {
          const userRef = doc(firestore, 'users', tx.userId);
          batch.update(userRef, {
              balance: increment(tx.amount),
              totalDeposits: increment(tx.amount)
          });
      }
      
      batch.set(permanentTxRef, permanentTxData);
      batch.delete(pendingRef);

      batch.commit()
        .then(() => {
            toast({ title: 'Success', description: `Deposit request has been ${approved ? 'approved' : 'rejected'}.` });
            fetchPendingTransactions();
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: pendingRef.path,
                operation: 'delete',
                requestResourceData: { tx, approved }
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setProcessingId(null);
        });
  }

  const handleWithdrawal = async (tx: PendingTransaction, approved: boolean) => {
      if (!firestore || !tx.userId) return;
      setProcessingId(tx.id);
      
      const batch = writeBatch(firestore);
      const pendingRef = doc(firestore, 'pendingWithdrawals', tx.id);
      const permanentTxRef = doc(collection(firestore, `users/${tx.userId}/transactions`));
      const userRef = doc(firestore, 'users', tx.userId);

       const permanentTxData = {
        type: tx.type,
        amount: tx.amount,
        date: serverTimestamp(),
        status: approved ? 'completed' : 'failed',
        walletAddress: tx.walletAddress,
        userId: tx.userId,
        username: tx.username,
        userDisplayName: tx.userDisplayName,
        userEmail: tx.userEmail,
      };

      if (approved) {
          batch.update(userRef, {
              totalWithdrawals: increment(tx.amount)
          });
      } else {
          // If rejected, return the funds to the user's balance
          batch.update(userRef, {
              balance: increment(tx.amount)
          });
      }

      batch.set(permanentTxRef, permanentTxData);
      batch.delete(pendingRef);
      
      batch.commit()
        .then(() => {
            toast({ title: 'Success', description: `Withdrawal request has been ${approved ? 'completed' : 'rejected'}.` });
            fetchPendingTransactions();
        })
        .catch(async (error) => {
             const permissionError = new FirestorePermissionError({
                path: pendingRef.path,
                operation: 'delete',
                requestResourceData: { tx, approved }
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setProcessingId(null);
        });
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
                <Badge className="ml-2">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : deposits.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
                Withdrawal Requests
                <Badge className="ml-2">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : withdrawals.length}</Badge>
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
                                               Requested on {formatDate(tx.date, true)}
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
                                               Requested on {formatDate(tx.date, true)}
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
