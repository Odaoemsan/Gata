
'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
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
import type { InvestmentPlan } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const planSchema = z.object({
  name: z.string().min(3, "Plan name must be at least 3 characters."),
  dailyProfit: z.coerce.number().positive("Daily profit must be a positive number."),
  duration: z.coerce.number().int().positive("Duration must be a positive integer."),
  minMax: z.string().min(3, "Min/Max description is required (e.g., $100 - $1000).")
});

export default function ManagePlansPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const plansQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'investmentPlans'));
    }, [firestore]);
    
    const { data: plans, loading } = useCollection<InvestmentPlan>(plansQuery);

    const form = useForm<z.infer<typeof planSchema>>({
        resolver: zodResolver(planSchema),
        defaultValues: { name: '', dailyProfit: 0, duration: 0, minMax: '' }
    });

    const openDialogForEdit = (plan: InvestmentPlan) => {
        setSelectedPlan(plan);
        form.reset({
            name: plan.name,
            dailyProfit: plan.dailyProfit,
            duration: plan.duration,
            minMax: plan.minMax,
        });
        setDialogOpen(true);
    };

    const openDialogForNew = () => {
        setSelectedPlan(null);
        form.reset({ name: '', dailyProfit: 0, duration: 0, minMax: '' });
        setDialogOpen(true);
    };

    const handleDelete = async (planId: string) => {
        if (!firestore || !confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
        
        setIsLoading(true);
        try {
            const planRef = doc(firestore, 'investmentPlans', planId);
            await deleteDoc(planRef);
            toast({ title: "Success", description: "Investment plan deleted successfully." });
        } catch (error) {
            console.error("Error deleting plan: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete plan." });
        } finally {
            setIsLoading(false);
        }
    };
    
    async function onSubmit(values: z.infer<typeof planSchema>) {
        if (!firestore) return;
        setIsLoading(true);

        try {
            if (selectedPlan) {
                // Update existing plan
                const planRef = doc(firestore, 'investmentPlans', selectedPlan.id);
                await updateDoc(planRef, values);
                toast({ title: "Success", description: "Investment plan updated successfully." });
            } else {
                // Create new plan
                await addDoc(collection(firestore, 'investmentPlans'), values);
                toast({ title: "Success", description: "New investment plan created." });
            }
            setDialogOpen(false);
        } catch (error) {
            console.error("Error saving plan: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save plan." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manage Investment Plans</h2>
                    <p className="text-muted-foreground">Create, view, edit, and delete investment plans.</p>
                </div>
                <Button onClick={openDialogForNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Plan
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plan Name</TableHead>
                                <TableHead>Daily Profit</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Min/Max</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && plans?.map(plan => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>{plan.dailyProfit}%</TableCell>
                                    <TableCell>{plan.duration} Days</TableCell>
                                    <TableCell>{plan.minMax}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(plan)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(plan.id)} disabled={isLoading}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!loading && plans?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No investment plans found. Create one to get started.
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
                        <DialogTitle>{selectedPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the investment plan.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Starter Plan" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dailyProfit" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Daily Profit (%)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="duration" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duration (Days)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="minMax" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Min/Max Investment</FormLabel>
                                    <FormControl><Input placeholder="e.g., $100 - $1000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {selectedPlan ? 'Save Changes' : 'Create Plan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
