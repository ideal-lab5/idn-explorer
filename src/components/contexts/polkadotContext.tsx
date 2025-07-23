'use client';

import { IChainStateService } from '@/services/IChainStateService';
import { IPolkadotApiService } from '@/services/IPolkadotApiService';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { container } from 'tsyringe';

interface PolkadotContextType {
  polkadotApiService: IPolkadotApiService;
  chainStateService: IChainStateService;
}

const PolkadotContext = createContext<PolkadotContextType | null>(null);

export const PolkadotProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<PolkadotContextType | null>(null);

  useEffect(() => {
    const polkadotApiService = container.resolve<IPolkadotApiService>('IPolkadotApiService');
    const chainStateService = container.resolve<IChainStateService>('IChainStateService');

    setServices({
      polkadotApiService,
      chainStateService,
    });
  }, []);

  if (!services) {
    return null;
  }

  return <PolkadotContext.Provider value={services}>{children}</PolkadotContext.Provider>;
};

export function usePolkadot() {
  const context = useContext(PolkadotContext);
  if (!context) {
    throw new Error('usePolkadot must be used within a PolkadotProvider');
  }
  return context;
}
