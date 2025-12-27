'use client';

import {
  onSnapshot,
  query,
  collection,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestore } from '../provider';

/**
 * A hook for accessing a Firestore collection in real-time.
 *
 * This hook can only be used within a child component of the `<FirebaseProvider />`.
 * It automatically updates your component when the collection data changes.
 *
 * @param query The Firestore query to execute.
 * @returns An object containing the collection data, loading state, and error state.
 *
 * @example
 * ```tsx
 * import { useCollection } from './firebase/firestore/use-collection';
 * import { collection, query, where } from 'firebase/firestore';
 * import { useFirestore } from './firebase/provider';
 *
 * function MyComponent() {
 *   const firestore = useFirestore();
 *   const myQuery = query(collection(firestore, 'items'), where('active', '==', true));
 *   const { data, loading, error } = useCollection(myQuery);
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   return (
 *     <ul>
 *       {data.map(item => (
 *         <li key={item.id}>{item.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useCollection<T extends DocumentData>(
  query: Query<T> | null
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as T)
        );
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error("Error fetching collection:", err);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
