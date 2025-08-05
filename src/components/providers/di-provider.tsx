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

  // In Next.js 15, we need to ensure the same structure is rendered on both server and client
  // to avoid hydration errors. We'll use a consistent approach instead of conditional rendering.
  return <>{children}</>;
}
