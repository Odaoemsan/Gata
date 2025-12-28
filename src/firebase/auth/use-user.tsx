'use client';

import { useAuthUser } from './provider';
import { useDoc } from '../firestore/use-doc';
import { doc, getFirestore } from 'firebase/firestore';
import { useFirebaseApp } from '../provider';
import { useMemo, useEffect } from 'react';
import { signInAnonymously, getAuth } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';


/**
 * A hook for accessing the currently signed-in user's data from Firestore.
 *
 * This hook can only be used within a child component of the `<AuthProvider />`.
 * It combines the user's authentication state with their data from Firestore.
 * It also handles redirecting unauthenticated users to the login page.
 *
 * @example
 * ```tsx
 * import { useUser } from './firebase/auth/use-user';
 *
 * function MyComponent() {
 *   const { user, userData, loading } = useUser();
 *
 *   if (loading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   if (!user) {
 *     // This case is handled by the hook, but you can add extra logic if needed
 *     return <div>Redirecting to login...</div>;
 *   }
 *
 *   return (
 *      <div>
 *          Welcome, {userData?.displayName}!
 *          Your balance is {userData?.balance}.
 *      </div>
 *   );
 * }
 * ```
 */
export function useUser() {
  const { user, loading: authLoading } = useAuthUser();
  const app = useFirebaseApp();
  const firestore = useMemo(() => getFirestore(app), [app]);
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemo(() => {
    if (!user) return undefined;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, loading: userLoading } = useDoc(userDocRef);

  useEffect(() => {
    // Let auth pages be accessible without a user
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    
    if (!authLoading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [authLoading, user, router, pathname]);

  return {
    user,
    userData,
    loading: authLoading || userLoading,
  };
}
