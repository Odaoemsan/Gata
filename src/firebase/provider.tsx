'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { AuthProvider } from './auth/provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// A flag to ensure persistence is only enabled once.
let persistenceEnabled = false;

function initializeFirebaseServices() {
  let firebaseApp: FirebaseApp;
  
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  if (!persistenceEnabled && typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(firestore)
      .then(() => {
        persistenceEnabled = true;
        // console.log("Firestore offline persistence enabled.");
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // console.warn("Firestore offline persistence could not be enabled: failed-precondition. This happens when multiple tabs are open.");
        } else if (err.code === 'unimplemented') {
          // console.warn("Firestore offline persistence could not be enabled: unimplemented. The current browser does not support it.");
        } else {
            // console.error("Failed to enable Firestore persistence:", err);
        }
      });
  }

  return { firebaseApp, auth, firestore };
}


export function FirebaseProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => initializeFirebaseServices(), []);

  return (
    <FirebaseContext.Provider value={firebaseServices}>
      <AuthProvider>
        <FirebaseErrorListener />
        {children}
      </AuthProvider>
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => useFirebase().firebaseApp;
export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
