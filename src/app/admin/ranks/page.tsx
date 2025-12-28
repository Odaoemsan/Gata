'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Rank } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const rankSchema = z.object({
  name: z.string().min(3, "Rank name must be at least 3 characters."),
  requiredInvestment: z.coerce.number().min(0, "Required investment cannot be negative."),
  commissionRate: z.coerce.number().min(0, "Commission rate cannot be negative.").max(100, "Commission rate cannot exceed 100."),
});

export default function ManageRanksPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const ranksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'ranks'));
    }, [firestore]);
    
    const { data: ranks, loading } = useCollection<Rank>(ranksQuery);

    const form = useForm<z.infer<typeof rankSchema>>({
        resolver: zodResolver(rankSchema),
        defaultValues: { name: '', requiredInvestment: '' as any, commissionRate: '' as any }
    });

    const openDialogForEdit = (rank: Rank) => {
        setSelectedRank(rank);
        form.reset(rank);
        setDialogOpen(true);
    };

    const openDialogForNew = () => {
        setSelectedRank(null);
        form.reset({ name: '', requiredInvestment: '' as any, commissionRate: '' as any });
        setDialogOpen(true);
    };

    const handleDelete = async (rankId: string) => {
        if (!firestore || !confirm('Are you sure you want to delete this rank? This action cannot be undone.')) return;
        
        setIsLoading(true);
        try {
            const rankRef = doc(firestore, 'ranks', rankId);
            await deleteDoc(rankRef);
            toast({ title: "Success", description: "Rank deleted successfully." });
        } catch (error) {
            console.error("Error deleting rank: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete rank." });
        } finally {
            setIsLoading(false);
        }
    };
    
    async function onSubmit(values: z.infer<typeof rankSchema>) {
        if (!firestore) return;
        setIsLoading(true);

        try {
            if (selectedRank) {
                const rankRef = doc(firestore, 'ranks', selectedRank.id);
                await updateDoc(rankRef, values);
                toast({ title: "Success", description: "Rank updated successfully." });
            } else {
                await addDoc(collection(firestore, 'ranks'), values);
                toast({ title: "Success", description: "New rank created." });
            }
            setDialogOpen(false);
        } catch (error) {
            console.error("Error saving rank: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save rank." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manage Ranks</h2>
                    <p className="text-muted-foreground">
                        Define rank requirements and referral commissions.
                    </p>
                </div>
                 <Button onClick={openDialogForNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Rank
                </Button>
            </div>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Referral Ranks</CardTitle>
                    <CardDescription>Configure the conditions and rewards for each rank.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank Name</TableHead>
                                <TableHead>Required Team Investment</TableHead>
                                <TableHead>Commission Rate</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && ranks?.map(rank => (
                                <TableRow key={rank.id}>
                                    <TableCell className="font-medium flex items-center gap-2"><Award className="h-4 w-4 text-yellow-500" /> {rank.name}</TableCell>
                                    <TableCell>${rank.requiredInvestment.toLocaleString()}</TableCell>
                                    <TableCell>{rank.commissionRate}%</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(rank)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(rank.id)} disabled={isLoading}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!loading && ranks?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No ranks found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedRank ? 'Edit Rank' : 'Create New Rank'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the referral rank.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rank Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Bronze" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="requiredInvestment" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Required Team Investment ($)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="commissionRate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Commission Rate (%)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 7" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {selectedRank ? 'Save Changes' : 'Create Rank'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
