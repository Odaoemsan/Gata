'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig } from './config';

import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { 
    FirebaseProvider,
    useFirebase,
    useFirebaseApp,
    useFirestore,
    useAuth, 
} from './provider';
import { FirebaseClientProvider } from './client-provider';


let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let persistenceEnabled = false;

function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  if (!persistenceEnabled && typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(firestore)
    .then(() => {
        persistenceEnabled = true;
        console.log("Firestore persistence enabled");
    })
    .catch((err) => {
        console.error("Failed to enable Firestore persistence:", err);
    });
  }

  return { firebaseApp, auth, firestore };
}

export { 
    initializeFirebase,
    FirebaseProvider,
    FirebaseClientProvider,
    useCollection,
    useDoc,
    useUser,
    useFirebase,
    useFirebaseApp,
    useFirestore,
    useAuth,
};
