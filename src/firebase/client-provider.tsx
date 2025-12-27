'use client';

import type { FirebaseApp } from 'firebase/app';
import { createContext, useContext, useMemo } from 'react';
import { initializeFirebase } from './index';

let app: FirebaseApp;

/**
 * React hook for accessing the initialized Firebase App instance.
 *
 * This hook can only be used within a child component of the `<FirebaseClientProvider />`.
 *
 * @example
 * ```tsx
 * import { useFirebaseClient } from './firebase/client-provider';
 *
 * function MyComponent() {
 *   const firebaseApp = useFirebaseClient();
 *   // ...
 * }
 * ```
 */
export function useFirebaseClient() {
  const firebaseApp = useContext(FirebaseClientContext);

  if (!firebaseApp) {
    throw new Error(
      'useFirebaseClient must be used within a FirebaseClientProvider'
    );
  }

  return firebaseApp;
}

const FirebaseClientContext = createContext<FirebaseApp | null>(null);

/**
 * A client-side-only React context provider that initializes Firebase and makes the
 * app instance available to all child components.
 *
 * This provider should be used at the root of your application to ensure that
 * Firebase is initialized only once.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { FirebaseClientProvider } from './firebase/client-provider';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <FirebaseClientProvider>{children}</FirebaseClientProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function FirebaseClientProvider(props: { children: React.ReactNode }) {
  const { firebaseApp } = useMemo(initializeFirebase, []);
  app = firebaseApp;

  return (
    <FirebaseClientContext.Provider value={app}>
      {props.children}
    </FirebaseClientContext.Provider>
  );
}
