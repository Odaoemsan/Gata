
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

// Schema for form validation
const signupSchema = z.object({
    displayName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    username: z.string().min(3, { message: "Username must be at least 3 characters." }).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    referralCode: z.string().optional(),
});

// Helper function to generate a new user's referral code
const generateReferralCode = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function SignupForm() {
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
      // --- Auth First ---
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Brief delay for auth state propagation
      await delay(500); 

      // --- Prepare Firestore Data ---
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
          dailyTradeCounter: 0,
      };

      // Add referredBy only if a valid code was provided
      const providedRefCode = values.referralCode?.trim();
      if (providedRefCode) {
         const referralQuery = query(collection(firestore, 'users'), where('referralCode', '==', providedRefCode));
         const referralSnapshot = await getDocs(referralQuery);
         if (referralSnapshot.empty) {
            // Silently ignore invalid referral codes
         } else {
            newUserDoc.referredBy = providedRefCode;
         }
      }

      // --- Create Firestore Document ---
      const userDocRef = doc(firestore, 'users', user.uid);
      
      await setDoc(userDocRef, newUserDoc)
        .catch((error) => {
            // This re-throws the error to be caught by the outer catch block
            // after wrapping it in our custom error for better debugging.
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: newUserDoc,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError; // Throw it to the outer catch
        });


      toast({
        title: 'Account Created',
        description: "Welcome! You're being redirected to your dashboard.",
      });
      router.push('/dashboard');

    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use by another account.';
        } else if (error instanceof FirestorePermissionError) {
            // The custom error was thrown and caught here.
            // The FirebaseErrorListener will already handle displaying it in dev mode.
            errorMessage = "A permission error occurred while creating your profile.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        toast({
            variant: 'destructive',
            title: 'Signup Failed',
            description: errorMessage,
        });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}
