'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { AppSettings } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';

const settingsSchema = z.object({
  supportLink: z.string().url("Please enter a valid URL."),
  depositWalletAddress: z.string().min(10, "Please enter a valid wallet address.")
});

export default function ManageSettingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const settingsDocRef = useMemo(() => {
        if (!firestore) return;
        return doc(firestore, 'settings', 'global');
    }, [firestore]);

    const { data: settings, loading: settingsLoading } = useDoc<AppSettings>(settingsDocRef);

    const form = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            supportLink: '',
            depositWalletAddress: '',
        }
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                supportLink: settings.supportLink,
                depositWalletAddress: settings.depositWalletAddress,
            });
        }
    }, [settings, form]);
    
    async function onSubmit(values: z.infer<typeof settingsSchema>) {
        if (!firestore) return;
        setIsLoading(true);

        try {
            await setDoc(doc(firestore, 'settings', 'global'), values, { merge: true });
            toast({ title: "Success", description: "Settings have been updated successfully." });
        } catch (error) {
            console.error("Error updating settings: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update settings." });
        } finally {
            setIsLoading(false);
        }
    }

    if (settingsLoading) {
        return (
             <div className="space-y-6">
                 <div>
                    <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                    <p className="text-muted-foreground">Manage global application settings.</p>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="flex justify-end">
                            <Skeleton className="h-10 w-28" />
                        </div>
                    </CardContent>
                </Card>
             </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                <p className="text-muted-foreground">Manage global application settings.</p>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Links & Addresses</CardTitle>
                            <CardDescription>
                                These values will be reflected across the entire user-facing application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <FormField control={form.control} name="supportLink" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Support Team Link</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="https://t.me/your-support-channel" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="depositWalletAddress" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Main Deposit Wallet Address (USDT TRC20)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="TXYZ..." 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                         <CardContent className="flex justify-end pt-0">
                             <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
