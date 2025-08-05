/*
 * Copyright 2025 by Ideal Labs, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client';
import { Avatar } from '@/components/avatar';
import {
  ConnectedWalletProvider,
  useConnectedWallet,
} from '@/components/contexts/connectedWalletContext';
import { Dropdown, DropdownButton } from '@/components/dropdown';
import { AccountDropdownMenu, ConnectWallet } from '@/components/idn/connectWallet';
import { BlockHeaders } from '@/components/idn/latestBlocks';
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar';
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar';
import { SidebarLayout } from '@/components/sidebar-layout';
import {
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  CubeIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid';
import { WalletIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  // Get the current pathname and provide a fallback to prevent null issues
  const pathname = usePathname() || '';
  const { isConnected, signerAddress, signerBalance } = useConnectedWallet();

  // Track connection status with local state to ensure UI updates
  const [walletConnected, setWalletConnected] = useState(false);

  // Update local state when global connection state changes
  useEffect(() => {
    setWalletConnected(isConnected);
  }, [isConnected]);

  return (
    <ConnectedWalletProvider>
      <SidebarLayout
        navbar={
          <Navbar>
            <NavbarSpacer />
            <NavbarSection>
              {walletConnected ? (
                // When connected, show the dropdown with disconnect option
                <Dropdown>
                  <DropdownButton as={NavbarItem}>
                    <Avatar src="/ideal/sticker-vertical.png" className="size-8" square alt="" />
                    <span className="sr-only text-sm text-zinc-600 md:not-sr-only md:ml-2 dark:text-zinc-400">
                      {signerAddress ? `${signerAddress.substring(0, 4)}...` : 'Connected'}
                    </span>
                  </DropdownButton>
                  <AccountDropdownMenu anchor="bottom end" />
                </Dropdown>
              ) : (
                // When not connected, show the connect button
                <ConnectWallet buttonOnly={true} />
              )}
            </NavbarSection>
          </Navbar>
        }
        sidebar={
          <Sidebar>
            <SidebarHeader>
              <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <Avatar src="/ideal/logo-onecolor-white-ISO.png" />
                  <SidebarLabel>Ideal Network</SidebarLabel>
                </DropdownButton>
              </Dropdown>
            </SidebarHeader>
            <SidebarBody>
              <SidebarSection>
                <SidebarHeading>Randomness</SidebarHeading>
                <SidebarItem
                  href="/subscriptions/dashboard"
                  current={Boolean(pathname === '/' || pathname === '/subscriptions/dashboard')}
                >
                  <ChartBarIcon />
                  <SidebarLabel>Delivery Monitor</SidebarLabel>
                </SidebarItem>
                <SidebarItem
                  href="/subscriptions"
                  current={Boolean(
                    pathname === '/subscriptions' ||
                      (pathname.startsWith('/subscriptions/') &&
                        pathname !== '/subscriptions/dashboard')
                  )}
                >
                  <BoltIcon />
                  <SidebarLabel>My Subscriptions</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              <SidebarSection>
                <SidebarHeading>Timelock</SidebarHeading>
                <SidebarItem
                  href="/network-activity"
                  current={Boolean(pathname === '/network-activity')}
                >
                  <SparklesIcon />
                  <SidebarLabel>Activity Hub</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/timelock" current={Boolean(pathname.startsWith('/timelock'))}>
                  <ClockIcon />
                  <SidebarLabel>My Transactions</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              <SidebarSection className="max-lg:hidden">
                <SidebarHeading>Status</SidebarHeading>
                <SidebarItem>
                  <CubeIcon />
                  <SidebarLabel>Recent blocks </SidebarLabel>
                </SidebarItem>
                <BlockHeaders />
              </SidebarSection>
              <SidebarSpacer />
              <SidebarSection>
                <SidebarItem href="https://docs.idealabs.network/docs/intro" target="blank">
                  <QuestionMarkCircleIcon />
                  <SidebarLabel>Documentation</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarBody>

            <ConnectWallet buttonOnly={false} />
          </Sidebar>
        }
      >
        {children}
      </SidebarLayout>
    </ConnectedWalletProvider>
  );
}
