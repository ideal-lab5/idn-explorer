'use client';

// Import client initialization to ensure reflect-metadata is loaded first
import '@/lib/client-init';
import 'reflect-metadata';

import { ConnectedWalletProvider } from '@/components/contexts/connectedWalletContext';
import { PolkadotProvider } from '@/components/contexts/polkadotContext';
import { SubscriptionProvider } from '@/components/contexts/subscriptionContext';
import { DIProvider } from '@/components/providers/di-provider';
import '@/styles/tailwind.css';
import { Inter } from 'next/font/google';
import { ApplicationLayout } from './application-layout';

const inter = Inter({ subsets: ['latin'] });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <body className={inter.className}>
      <DIProvider>
        <PolkadotProvider>
          <ConnectedWalletProvider>
            <SubscriptionProvider>
              <ApplicationLayout>{children}</ApplicationLayout>
            </SubscriptionProvider>
          </ConnectedWalletProvider>
        </PolkadotProvider>
      </DIProvider>
    </body>
  );
}
