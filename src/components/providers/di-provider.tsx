'use client';

import { container } from '@/lib/di-container';
import { useEffect, useState } from 'react';

export function DIProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Container is already initialized by the import
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
