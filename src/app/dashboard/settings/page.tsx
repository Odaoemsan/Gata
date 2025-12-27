
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, KeyRound, Copy } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { getAuth, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { useFirebaseApp, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';


const profileSchema = z.object({
    displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export default function SettingsPage() {
    const { toast } = useToast();
    const { user, userData, loading: userLoading } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordResetting, setIsPasswordResetting] = useState(false);
    const firebaseApp = useFirebaseApp();
    const firestore = useFirestore();


    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        values: {
            displayName: userData?.displayName || '',
        }
    });

    async function onSubmit(values: z.infer<typeof profileSchema>) {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                displayName: values.displayName
            });
            await updateProfile(user, {
                displayName: values.displayName
            });
            toast({
                title: 'Profile Updated',
                description: 'Your name has been updated successfully.',
            });
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update your profile.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setIsPasswordResetting(true);
        const auth = getAuth(firebaseApp);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: 'Password Reset Email Sent',
                description: `An email has been sent to ${user.email} with instructions to reset your password.`,
            });
        } catch (error: any) {
            console.error(error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to send password reset email.',
            });
        } finally {
            setIsPasswordResetting(false);
        }
    }
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Username copied to clipboard.',
        });
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile</CardTitle>
                                    <CardDescription>Update your personal information.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="space-y-2">
                                        <Label htmlFor="username">Username (UID)</Label>
                                        <div className="relative">
                                            <Input id="username" readOnly value={userData?.username ?? ''} className="pr-10"/>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={() => handleCopy(userData?.username ?? '')}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="displayName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <div className="relative">
                                                     <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input placeholder="Your full name" {...field} className="pl-10" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
                 <div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your account security.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <p className="text-sm text-muted-foreground">Click the button below to receive an email to reset your password.</p>
                                <Button variant="outline" onClick={handlePasswordReset} disabled={isPasswordResetting}>
                                    {isPasswordResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Send Password Reset Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
