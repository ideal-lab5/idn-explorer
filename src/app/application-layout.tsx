'use client'
import { Avatar } from '@/components/avatar'
import { BlockHeaders } from '@/components/etf/latestBlocks'
import { LatestEvents } from '@/components/etf/recentEvents'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
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
  ChevronDownIcon,
  Cog8ToothIcon,
} from '@heroicons/react/16/solid'
import {
  QuestionMarkCircleIcon,
  SparklesIcon,
  ClockIcon,
  CubeIcon,
  RocketLaunchIcon,
} from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'
import { ConnectedWalletProvider } from "@/components/etf/ConnectedWalletContext";
import { ConnectWallet, AccountDropdownMenu } from "@/components/etf/connectWallet";


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
                <SidebarItem href="/" current={pathname === '/'}>
                  <SparklesIcon />
                  <SidebarLabel>Explore</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/compose" current={pathname.startsWith('/compose')}>
                  <ClockIcon />
                  <SidebarLabel>Compose</SidebarLabel>
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
