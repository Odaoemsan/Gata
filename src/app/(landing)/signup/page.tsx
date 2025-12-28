
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Loader2 } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username must contain only English letters, numbers, and underscores.',
    }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  referredBy: z.string().optional(),
});

function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      referredBy: refCode || '',
    },
  });
  
   useEffect(() => {
    if (refCode) {
      form.setValue('referredBy', refCode);
    }
  }, [refCode, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!firebaseApp) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized.'})
        setIsLoading(false);
        return;
    }
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      
      try {
        await updateProfile(user, {
            displayName: values.displayName,
        });

        const referralCode = generateReferralCode(); // We assume it's unique enough for this flow.
        const userDocRef = doc(firestore, 'users', user.uid);
        
        const newUserDoc: any = {
            displayName: values.displayName,
            username: values.username.toLowerCase(),
            email: values.email.toLowerCase(),
            balance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            referralCommissions: 0,
            createdAt: serverTimestamp(),
            referralCode: referralCode,
        };

        if (values.referredBy) {
            newUserDoc.referredBy = values.referredBy;
        }

        await setDoc(userDocRef, newUserDoc);
        
        toast({
            title: 'Account Created',
            description: "You've been successfully signed up!",
        });
        router.push('/dashboard');

      } catch (firestoreError: any) {
        // This catch block handles errors during Firestore document creation,
        // like permission denied due to a non-unique username.
        await deleteUser(user); // Important: Clean up the created auth user.

        if (firestoreError.code === 'permission-denied') {
            form.setError('username', { type: 'manual', message: 'This username is already taken. Please choose another one.' });
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'This username is already taken.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'An error occurred while setting up your profile.',
            });
        }
        setIsLoading(false);
      }

    } catch (authError: any) {
        // This catch block handles errors from createUserWithEmailAndPassword,
        // like email-already-in-use.
        let errorMessage = 'An unknown error occurred.';
        if (authError.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
            form.setError('email', { type: 'manual', message: errorMessage });
        } else {
            errorMessage = authError.message || 'Failed to create account. Please try again later.';
        }
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: errorMessage,
        });
        setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
         <div className="flex items-center justify-center gap-2 mb-4">
          <Rocket className="h-8 w-8 text-primary" />
          <span className="font-headline text-3xl font-bold text-primary">
            GORA
          </span>
        </div>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Create an account to start your investment journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={isLoading}
                    />
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
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="johndoe"
                      {...field}
                      disabled={isLoading}
                    />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      {...field}
                      disabled={isLoading}
                    />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="referredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter referral code"
                        {...field}
                        disabled={isLoading || !!refCode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
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
  );
}


export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}>
        <SignUpForm />
      </Suspense>
    </div>
  )
}
