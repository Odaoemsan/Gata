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

const generateReferralCode = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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

    try {
      // Check if username is unique
      const usernameQuery = query(collection(firestore, 'users'), where('username', '==', values.username));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        form.setError('username', { type: 'manual', message: 'This username is already taken.' });
        setIsLoading(false);
        return;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const newUser = {
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        balance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        referralCommissions: 0,
        createdAt: serverTimestamp(),
        referralCode: generateReferralCode(7),
        ...(values.referralCode && { referredBy: values.referralCode }),
      };

      await setDoc(doc(firestore, 'users', user.uid), newUser);
      
      toast({
        title: 'Account Created',
        description: 'Welcome! Your account has been created successfully.',
      });
      router.push('/dashboard');
    } catch (error: any) {
       let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already in use. Please try logging in.';
        } else if (error.name === 'FirebaseError' && (error.message.includes('permission-denied') || error.message.includes('insufficient permissions'))) {
            description = 'Failed to create user profile due to security rules. Please check the data and try again.';
        }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
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
                    <Input id="displayName" placeholder="John Doe" {...field} />
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
                    <Input id="username" placeholder="johndoe" {...field} />
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
                    <Input id="email" type="email" placeholder="m@example.com" {...field} />
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
                    <Input id="password" type="password" {...field} />
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
                    <Input id="referralCode" placeholder="Enter referral code" {...field} />
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
