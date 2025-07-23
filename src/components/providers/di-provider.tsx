'use client';

import { container } from '@/lib/di-container';
import '@/lib/reflect-metadata'; // Import reflect-metadata first
import { useEffect, useState } from 'react';

export function DIProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure container is initialized only on the client side
    if (typeof window !== 'undefined') {
      // Container is already initialized by the import
      setIsReady(true);
    }
  }, []);

  // During SSR or before hydration, render children without DI
  // This prevents hydration mismatches
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  // During client-side rendering, wait for DI to be ready
  if (!isReady) {
    // Return a minimal placeholder to avoid layout shifts
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <>{children}</>;
}
