
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
            getDocs(depositsQuery),
            getDocs(withdrawalsQuery)
        ]);

        const pendingDeposits = depositsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingTransaction));
        const pendingWithdrawals = withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingTransaction));

        setDeposits(pendingDeposits);
        setWithdrawals(pendingWithdrawals);
    } catch (error: any) {
        const permissionError = new FirestorePermissionError({ path: 'pendingDeposits/pendingWithdrawals', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch pending transactions. Check permissions.' });
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
  
  const handleDeposit = async (tx: PendingTransaction, approved: boolean) => {
      if (!firestore || !tx.userId) return;
      setProcessingId(tx.id);

      try {
        const batch = writeBatch(firestore);
        
        // 1. Reference to the pending request to be deleted
        const pendingRef = doc(firestore, 'pendingDeposits', tx.id);

        // 2. Reference to the user's permanent transaction log
        const permanentTxRef = doc(collection(firestore, `users/${tx.userId}/transactions`));

        if (approved) {
            // 3. If approved, reference the user document to update balance
            const userRef = doc(firestore, 'users', tx.userId);
            batch.update(userRef, {
                balance: increment(tx.amount),
                totalDeposits: increment(tx.amount)
            });
            // 4. Create a permanent 'completed' transaction record
            batch.set(permanentTxRef, { ...tx, status: 'completed', date: serverTimestamp() });
        } else {
             // 4. If rejected, create a permanent 'failed' transaction record
             batch.set(permanentTxRef, { ...tx, status: 'failed', date: serverTimestamp() });
        }

        // 5. Delete the pending request
        batch.delete(pendingRef);

        // 6. Commit all operations
        await batch.commit();
        
        toast({ title: 'Success', description: `Deposit request has been ${approved ? 'approved' : 'rejected'}.` });
        fetchPendingTransactions();
      } catch (error) {
         console.error("Error processing deposit: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to process deposit.' });
      } finally {
        setProcessingId(null);
      }
  }

  const handleWithdrawal = async (tx: PendingTransaction, approved: boolean) => {
      if (!firestore || !tx.userId) return;
      setProcessingId(tx.id);
      
      try {
        const batch = writeBatch(firestore);
        
        // 1. Reference to the pending request to be deleted
        const pendingRef = doc(firestore, 'pendingWithdrawals', tx.id);
        
        // 2. Reference to the user's permanent transaction log
        const permanentTxRef = doc(collection(firestore, `users/${tx.userId}/transactions`));
        
        // 3. Reference to the user document
        const userRef = doc(firestore, 'users', tx.userId);

        if (approved) {
            // On approval, update totalWithdrawals and create permanent record.
            // Balance was already debited when user made the request.
            batch.update(userRef, {
                totalWithdrawals: increment(tx.amount)
            });
            batch.set(permanentTxRef, { ...tx, status: 'completed', date: serverTimestamp() });
             toast({ title: 'Success', description: `Withdrawal request has been completed.` });

        } else {
            // If rejected, return the funds to the user's balance and create failed record.
            batch.update(userRef, {
                balance: increment(tx.amount)
            });
            batch.set(permanentTxRef, { ...tx, status: 'failed', date: serverTimestamp() });
            toast({ title: 'Success', description: `Withdrawal request has been rejected.` });
        }

        // 4. Delete the pending request
        batch.delete(pendingRef);
        
        // 5. Commit all operations
        await batch.commit();

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
                <Badge className="ml-2">{loading ? '...' : deposits.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
                Withdrawal Requests
                <Badge className="ml-2">{loading ? '...' : withdrawals.length}</Badge>
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
