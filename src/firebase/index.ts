'use client';

// This file is the "barrel" for all Firebase-related functionality.
// It re-exports all the necessary hooks and providers.

export { 
    FirebaseProvider,
    useFirebase,
    useFirebaseApp,
    useFirestore,
    useAuth, 
} from './provider';

export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
