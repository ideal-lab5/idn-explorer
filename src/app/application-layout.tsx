'use client'
import "reflect-metadata";
import { Avatar } from '@/components/avatar'
import { Badge } from '@/components/badge'
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
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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
import { useState } from 'react'
import { Button } from "../components/button";
import { Dialog, DialogTitle } from "@/components/dialog";
import { Text } from "@/components/text";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";

function AccountDropdownMenu({ anchor, onDisconnect }: { readonly anchor: 'top start' | 'bottom end', onDisconnect: () => void }) {
  console.log("disconnect: ", onDisconnect);
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="#" onClick={(e: any) => { e.preventDefault(); onDisconnect(); }}>
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Disconnect</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  )
}

export function ApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let pathname = usePathname()

  const [isConnected, setIsConnected] = useState(false);
  const [showWalletSelection, setShowWalletSelection] = useState(false)
  const [signer, setSigner] = useState<any>(null);
  const [signerAddress, setSignerAddress] = useState<string>("");
  const [availableAccounts, setAvailableAccounts] = useState<any>([]);

  async function connect() {
    if (typeof window !== "undefined") {
      // Client-side-only code
      const ext = await import("@polkadot/extension-dapp");
      const _ = await ext.web3Enable('etf-auction');
      const allAccounts = await ext.web3Accounts();
      setAvailableAccounts(allAccounts);
    }
  }

  // Handler for the click event of the `Connect` button on the NavBar.
  const handleConnect = async () => {
    await connect();
    setShowWalletSelection(true);
  }

  const handleSelectWallet = (address: string) => async () => {
    const ext = await import("@polkadot/extension-dapp");
    // finds an injector for an address
    const injector = await ext.web3FromAddress(address);
    setSigner({ signer: injector.signer, address });
    setSignerAddress(address);
    setIsConnected(true);
    setShowWalletSelection(false);
  }

  const disconnect = async () => {
    setSignerAddress("");
    setSigner(null);
    setIsConnected(false);
    setAvailableAccounts([]);
  }

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src="/users/erica.jpg" square />
              </DropdownButton>
              <AccountDropdownMenu anchor="bottom end" onDisconnect={disconnect} />
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
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#">
                  <Avatar slot="icon" src="/ideal/logo-onecolor-white-ISO.png" />
                  <DropdownLabel>Ideal Network</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
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
              <SidebarItem href={"#"}>
                <CubeIcon />
                <SidebarLabel>Recent blocks </SidebarLabel>
              </SidebarItem>
              <SidebarItem href={"#"}>
                <SidebarLabel><Badge color="lime">21,380,010</Badge> 0x91c...32541</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={"#"}>
                <SidebarLabel><Badge color="lime">21,380,009</Badge> 0x93c...32540</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={"#"}>
                <SidebarLabel><Badge color="lime">21,380,008</Badge> 0x93c...32547</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={"#"}>
                <RocketLaunchIcon />
                <SidebarLabel>Recent events </SidebarLabel>
              </SidebarItem>
              <SidebarItem href={"/compose/12345"}>
                <SidebarLabel><Badge color="purple">Contract call</Badge> 0x91c...32541</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={"/compose/12346"}>
                <SidebarLabel><Badge color="purple">Extrinsic call</Badge> 0x93c...32540</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
            <SidebarSpacer />
            <SidebarSection>
              <SidebarItem href="https://docs.idealabs.network/docs/intro" target='blank'>
                <QuestionMarkCircleIcon />
                <SidebarLabel>Documentation</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            {isConnected ? <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar src="/ideal/sticker-vertical.png" className="size-10" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">Connected</span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      {`${signerAddress.substring(0, 4)}...${signerAddress.substring(signerAddress.length - 4, signerAddress.length)}`}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <AccountDropdownMenu anchor="top start" onDisconnect={disconnect}  />
            </Dropdown> : <Button onClick={(e: any) => { e.preventDefault(); handleConnect(); }} color="cyan">Connect</Button>}
          </SidebarFooter>
          <Dialog
            open={showWalletSelection}
            onClose={() => setShowWalletSelection(false)}
            size="lg"

          >
            <DialogTitle>Select a wallet</DialogTitle>
            {availableAccounts.length > 0 ?
              <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Address</TableHeader>
                    <TableHeader></TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableAccounts.map((account: any, index: number) => (
                    <TableRow key={"wallet" + index}>
                      <TableCell className="font-medium">
                        {account.meta.name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${account.address.substring(0, 4)} ... ${account.address.substring(account.address.length - 4, account.address.length)}`}
                      </TableCell>
                      <TableCell>
                        <Button
                          color="cyan"
                          onClick={handleSelectWallet(account.address)}
                        >
                          Connect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              : <div className="rounded-md p-4">
                <div className="flex">
                  <Text>You need polkadotjs and at least one wallet to use this app.</Text>
                </div>
              </div>}
          </Dialog>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
