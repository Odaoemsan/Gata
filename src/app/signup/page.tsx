
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

const generateReferralCode = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};


const signupSchema = z.object({
    displayName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    username: z.string().min(3, { message: "Username must be at least 3 characters." }).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    referralCode: z.string().optional(),
});


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
    const referredByCode = values.referralCode?.trim();

    try {
      // 1. Pre-emptive checks for username and referral code
      const usernameQuery = query(collection(firestore, 'users'), where('username', '==', values.username));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        form.setError('username', { type: 'manual', message: 'This username is already taken.' });
        setIsLoading(false);
        return;
      }
      
      if (referredByCode) {
        const referralQuery = query(collection(firestore, 'users'), where('referralCode', '==', referredByCode));
        const referralSnapshot = await getDocs(referralQuery);
        if (referralSnapshot.empty) {
          form.setError('referralCode', { type: 'manual', message: 'This referral code does not exist.' });
          setIsLoading(false);
          return;
        }
      }

      // 2. Auth First
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 3. Prepare Firestore Data
      const newUserDoc: any = {
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        referralCode: generateReferralCode(7),
        balance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        referralCommissions: 0,
        createdAt: serverTimestamp(),
      };
      
      // Only add referredBy if a valid code was provided
      if (referredByCode) {
          newUserDoc.referredBy = referredByCode;
      }

      // 4. Create Firestore Document
      const userDocRef = doc(firestore, 'users', user.uid);
      
      // Use a .catch block to implement contextual error handling
      setDoc(userDocRef, newUserDoc)
        .then(() => {
            toast({
              title: 'Account Created',
              description: 'Welcome! Your account has been created successfully.',
            });
            router.push('/dashboard');
        })
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUserDoc,
            });
            errorEmitter.emit('permission-error', permissionError);
             // Also show a toast to the user
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: "Could not save user data due to a permissions issue.",
            });
        });

    } catch (error: any) {
      // This catches errors from createUserWithEmailAndPassword and pre-emptive checks
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || "An unexpected error occurred. Please check the details and try again.",
      });
    } finally {
        // Only set loading to false if not waiting for setDoc
        if (auth.currentUser === null) {
            setIsLoading(false);
        }
    }
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
