'use client';

import '@/styles/tailwind.css';
import { Inter } from 'next/font/google';
import { ConnectedWalletProvider } from '@/components/contexts/connectedWalletContext';
import { PolkadotProvider } from '@/components/contexts/polkadotContext';
import { ApplicationLayout } from './application-layout';
import { DIProvider } from '@/components/providers/di-provider';

const inter = Inter({ subsets: ['latin'] });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <body className={inter.className}>
      <DIProvider>
        <PolkadotProvider>
          <ConnectedWalletProvider>
            <ApplicationLayout>
              {children}
            </ApplicationLayout>
          </ConnectedWalletProvider>
        </PolkadotProvider>
      </DIProvider>
    </body>
  );
}
