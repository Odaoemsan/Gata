'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * A client component that listens for Firestore permission errors
 * and throws them to be caught by Next.js's development error overlay.
 * This is crucial for debugging security rules during development.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // In a development environment, we want to throw the error
      // to make it visible in the Next.js error overlay.
      if (process.env.NODE_ENV === 'development') {
        // We throw it in a timeout to break out of the current React render cycle
        // and ensure it's caught by the global error handler.
        setTimeout(() => {
          throw error;
        });
      } else {
        // In production, you might want to log this to a service
        // like Sentry, LogRocket, etc.
        console.error('Firestore Permission Error:', error);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything
}
