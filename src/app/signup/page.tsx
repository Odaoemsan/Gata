
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Schema for form validation
const signupSchema = z.object({
    displayName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    username: z.string().min(3, { message: "Username must be at least 3 characters." }).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    referralCode: z.string().optional(),
});

// Function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function SignupPage() {
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const referralCodeFromUrl = searchParams.get('ref') || '';
  
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      referralCode: referralCodeFromUrl,
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        setIsLoading(false);
        return;
    }

    const auth = getAuth(firebaseApp);
    
    // --- Pre-emptive Checks ---
    try {
        // Check for username uniqueness
        const usernameQuery = query(collection(firestore, 'users'), where('username', '==', values.username));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (!usernameSnapshot.empty) {
            form.setError('username', { type: 'manual', message: 'This username is already taken.' });
            setIsLoading(false);
            return;
        }

        // Check if referral code exists, if provided
        const referredByCode = values.referralCode?.trim() || null;
        if (referredByCode) {
            const referralQuery = query(collection(firestore, 'users'), where('referralCode', '==', referredByCode));
            const referralSnapshot = await getDocs(referralQuery);
            if (referralSnapshot.empty) {
                form.setError('referralCode', { type: 'manual', message: 'This referral code does not exist.' });
                setIsLoading(false);
                return;
            }
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Could not verify user details. ' + error.message });
        setIsLoading(false);
        return;
    }


    // --- Auth First ---
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Wait 500ms to ensure auth state is propagated for security rules
      await delay(500);

      // --- Prepare Firestore Data (Clean Data) ---
      const newUserDoc = {
          // Required user info
          displayName: values.displayName,
          username: values.username,
          email: values.email,

          // Mandatory financial fields as Numbers
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          referralCommissions: 0,

          // Generated referral code for the new user
          referralCode: generateReferralCode(7),

          // Optional referral, set to null if not provided
          referredBy: values.referralCode?.trim() || null,
      };

      // --- Firestore Document Creation ---
      const userDocRef = doc(firestore, 'users', user.uid);
      
      await setDoc(userDocRef, newUserDoc);

      toast({
        title: 'Account Created',
        description: 'Welcome! Your account has been created successfully.',
      });
      router.push('/dashboard');

    } catch (error: any) {
        // This catches errors from both Auth and Firestore
        const isAuthError = error.code && error.code.startsWith('auth/');
        
        if (isAuthError) {
             toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: error.message,
            });
        } else {
            // This is likely a Firestore security rule error
             const permissionError = new FirestorePermissionError({
                path: `/users/${auth.currentUser?.uid || 'unknown_uid'}`,
                operation: 'create',
                requestResourceData: "See newUserDoc object in the signup page code.", // Can't pass newUserDoc directly here
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: 'Could not save your user data due to a permissions issue. Please contact support.',
            });
        }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate a new user's referral code
  const generateReferralCode = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="displayName">Full Name</Label>
                    <FormControl>
                        <Input id="displayName" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="username">Username</Label>
                     <FormControl>
                        <Input id="username" placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email">Email</Label>
                     <FormControl>
                        <Input id="email" type="email" placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password">Password</Label>
                    <FormControl>
                        <Input id="password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <FormControl>
                        <Input id="referralCode" placeholder="Enter referral code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create an account
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
