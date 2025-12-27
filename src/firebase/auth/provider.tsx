'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from '../provider';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

/**
 * A provider that makes the currently signed-in user available to all child
 * components.
 *
 * This provider should be used at the root of your application, and must be
 * a child of `<FirebaseProvider>`.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { AuthProvider } from './firebase/auth/provider';
 * import { FirebaseProvider } from './firebase/provider';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *  return (
 *    <html lang="en">
 *     <body>
 *       <FirebaseProvider>
 *         <AuthProvider>{children}</AuthProvider>
 *       </FirebaseProvider>
 *     </body>
 *    </html>
 * );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * A hook for accessing the currently signed-in user.
 *
 * This hook can only be used within a child component of the `<AuthProvider />`.
 *
 * @example
 * ```tsx
 * import { useAuthUser } from './firebase/auth/provider';
 *
 * function MyComponent() {
 *   const { user, loading } = useAuthUser();
 *
 *   if (loading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   if (!user) {
 *     return <div>Not signed in</div>;
 *   }
 *
 *   return <div>Welcome, {user.displayName}!</div>;
 * }
 * ```
 */
export const useAuthUser = () => {
  return useContext(AuthContext);
};
