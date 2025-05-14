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

'use client'
import { Avatar } from '@/components/avatar'
import { BlockHeaders } from '@/components/timelock/latestBlocks'
import {
  Dropdown,
  DropdownButton,
} from '@/components/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
  QuestionMarkCircleIcon,
  SparklesIcon,
  ClockIcon,
  CubeIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'
import { ConnectedWalletProvider } from "@/components/contexts/connectedWalletContext";
import { ConnectWallet, AccountDropdownMenu } from "@/components/timelock/connectWallet";

export function ApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let pathname = usePathname();

  return (
    <ConnectedWalletProvider>
      <SidebarLayout
        navbar={
          <Navbar>
            <NavbarSpacer />
            <NavbarSection>
              <Dropdown>
                <DropdownButton as={NavbarItem}>
                  <Avatar src="/users/erica.jpg" square />
                </DropdownButton>
                <AccountDropdownMenu anchor="bottom end" />
              </Dropdown>
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
                <SidebarItem href="/subscriptions/dashboard" current={pathname === '/' || pathname === '/subscriptions/dashboard'}>
                  <ChartBarIcon />
                  <SidebarLabel>Delivery Monitor</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/subscriptions" current={pathname === '/subscriptions' || (pathname.startsWith('/subscriptions/') && pathname !== '/subscriptions/dashboard')}>
                  <BoltIcon />
                  <SidebarLabel>My Subscriptions</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              <SidebarSection>
                <SidebarHeading>Timelock</SidebarHeading>
                <SidebarItem href="/network-activity" current={pathname === '/network-activity'}>
                  <SparklesIcon />
                  <SidebarLabel>Activity Hub</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/compose" current={pathname.startsWith('/compose')}>
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
                <SidebarItem href="https://docs.idealabs.network/docs/intro" target='blank'>
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
  )
}
