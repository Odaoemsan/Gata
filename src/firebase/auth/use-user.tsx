'use client';

import { useAuthUser } from './provider';
import { useDoc } from '../firestore/use-doc';
import { doc, getFirestore } from 'firebase/firestore';
import { useFirebaseApp } from '../provider';
import { useMemo } from 'react';
import { signInAnonymously, getAuth } from 'firebase/auth';


/**
 * A hook for accessing the currently signed-in user's data from Firestore.
 *
 * This hook can only be used within a child component of the `<AuthProvider />`.
 * It combines the user's authentication state with their data from Firestore.
 * If no user is signed in, it will attempt to sign in anonymously.
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
 *     return <div>Not signed in</div>;
 *   }
 *
 *   return (
 *      <div>
 *          Welcome, {user.displayName}!
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

  const userDocRef = useMemo(() => {
    if (!user) return undefined;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData, loading: userLoading } = useDoc(userDocRef);

  // Automatically sign in anonymously if no user is present
  useMemo(() => {
    if (!authLoading && !user) {
        const auth = getAuth(app);
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
        });
    }
  }, [authLoading, user, app]);

  return {
    user,
    userData,
    loading: authLoading || userLoading,
  };
}
