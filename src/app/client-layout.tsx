'use client';

import '@/styles/tailwind.css';
import { Inter } from 'next/font/google';
import { ConnectedWalletProvider } from '@/components/contexts/connectedWalletContext';
import { PolkadotProvider } from '@/components/contexts/polkadotContext';
import { SubscriptionProvider } from '@/components/contexts/subscriptionContext';
import { ApplicationLayout } from './application-layout';
import { DIProvider } from '@/components/providers/di-provider';

const inter = Inter({ subsets: ['latin'] });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <body className={inter.className}>
      <DIProvider>
        <PolkadotProvider>
          <ConnectedWalletProvider>
            <SubscriptionProvider>
              <ApplicationLayout>
                {children}
              </ApplicationLayout>
            </SubscriptionProvider>
          </ConnectedWalletProvider>
        </PolkadotProvider>
      </DIProvider>
    </body>
  );
}
