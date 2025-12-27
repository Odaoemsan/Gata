'use client';

import {
  onSnapshot,
  doc,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';
import { FirestorePermissionError } from '../errors';
import { errorEmitter } from '../error-emitter';

/**
 * A hook for accessing a Firestore document in real-time.
 *
 * This hook can only be used within a child component of the `<FirebaseProvider />`.
 * It automatically updates your component when the document data changes.
 *
 * @param ref The Firestore document reference to listen to.
 * @returns An object containing the document data, loading state, and error state.
 *
 * @example
 * ```tsx
 * import { useDoc } from './firebase/firestore/use-doc';
 * import { doc } from 'firebase/firestore';
 * import { useFirestore } from './firebase/provider';
 *
 * function MyComponent({ itemId }) {
 *   const firestore = useFirestore();
 *   const docRef = doc(firestore, 'items', itemId);
 *   const { data, loading, error } = useDoc(docRef);
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   if (!data) return <p>Document not found</p>;
 *
 *   return <h1>{data.name}</h1>;
 * }
 * ```
 */
export function useDoc<T extends DocumentData>(
  ref: DocumentReference<T> | undefined
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          setData({ ...doc.data(), id: doc.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // The ref object is memoized in the component that uses this hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return { data, loading, error };
}
