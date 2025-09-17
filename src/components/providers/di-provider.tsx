'use client';

import { useEffect, useState } from 'react';

export function DIProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Dynamically import DI container only on client side
    const initializeDI = async () => {
      if (typeof window !== 'undefined') {
        await import('@/lib/di-container');
        setIsReady(true);
      }
    };

    initializeDI();
  }, []);

  // Always render the same structure for SSR and client
  // Use a consistent wrapper to avoid hydration mismatches
  return <div data-di-provider={isReady ? 'ready' : 'loading'}>{children}</div>;
}
