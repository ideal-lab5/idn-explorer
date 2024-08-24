'use client'

import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Navbar, NavbarItem, NavbarSection } from '@/components/navbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getExecutedTransactions, getGeneratedRandomness, getScheduledTransactions } from '@/data'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'

export function Stat({ title, value, change, helpText }: { title: string; value: string; change: string; helpText?: string }) {
  return (
    <div>
      <Divider />
      <div className="mt-6 text-lg/6 font-medium sm:text-sm/6">{title}</div>
      <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{value}</div>
      <div className="mt-3 text-sm/6 sm:text-xs/6">
        <Badge color={'purple'}>{change}</Badge>{' '}
        <span className="text-zinc-500">{helpText}</span>
      </div>
    </div>
  )
}

export default function Home() {
  let executedTransactions = getExecutedTransactions();
  let scheduledTransactions = getScheduledTransactions();
  let generatedRandomness = getGeneratedRandomness();
  let [selectedTab, setSelectedTab] = useState(0);

  return (
    <>
      <Heading>The Ideal Network Explorer</Heading>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Last Block" value="#21,380,509" change="1.2s" helpText="target 6s" />
        <Stat title="Epoch" value="79%" change="4h 48m 36s" />
        <Stat title="Executed" value="100" change="+4.5%" />
        <Stat title="Scheduled" value="148" change="+21.2%" />
      </div>
      <Subheading className="mt-10"><Badge color="lime">Transactions</Badge></Subheading>
      <div>
        <Navbar>
          <NavbarSection>
            <NavbarItem href="#" onClick={() => setSelectedTab(0)} current={selectedTab === 0}>Executed</NavbarItem>
            <NavbarItem href="#" onClick={() => setSelectedTab(1)} current={selectedTab === 1}>Scheduled</NavbarItem>
            <NavbarItem href="#" onClick={() => setSelectedTab(2)} current={selectedTab === 2}>Randomness</NavbarItem>
          </NavbarSection>
        </Navbar>
      </div>
      {selectedTab === 0 && <>
        <div className="mt-4 grid xl:grid-cols-2 sm:grid-cols-2">
          <InputGroup>
            <MagnifyingGlassIcon />
            <Input name="searchExecuted" id="searchExecuted" placeholder="Search executed txs" aria-label="Search" />
          </InputGroup>
        </div>
        <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
          <TableHead>
            <TableRow>
              <TableHeader>Block number</TableHeader>
              <TableHeader>Id</TableHeader>
              <TableHeader>Owner</TableHeader>
              <TableHeader>Operation</TableHeader>
              <TableHeader className="text-right">Result</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {executedTransactions.map((transaction) => (
              <TableRow key={transaction.cid} href={transaction.url} title={`Transaction #${transaction.cid}`}>
                <TableCell>{transaction.block}</TableCell>
                <TableCell className="text-zinc-500">{transaction.cid}</TableCell>
                <TableCell>{transaction.owner}</TableCell>
                <TableCell>{transaction.operation}</TableCell>
                <TableCell className="text-right"><Badge color={transaction.status === "Confirmed" ? "lime" : "red"}>{transaction.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></>}
        {selectedTab === 1 && <>
        <div className="mt-4 grid xl:grid-cols-2 sm:grid-cols-2">
          <InputGroup>
            <MagnifyingGlassIcon />
            <Input name="searchScheduled" id="searchScheduled" placeholder="Search scheduled txs" aria-label="Search" />
          </InputGroup>
        </div>
        <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
          <TableHead>
            <TableRow>
              <TableHeader>Scheduled Block</TableHeader>
              <TableHeader>Id</TableHeader>
              <TableHeader>Owner</TableHeader>
              <TableHeader>Operation</TableHeader>
              <TableHeader className="text-right">Deadline Block</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledTransactions.map((transaction) => (
              <TableRow key={transaction.cid} href={transaction.url} title={`Transaction #${transaction.cid}`}>
                <TableCell>{transaction.block}</TableCell>
                <TableCell className="text-zinc-500">{transaction.cid}</TableCell>
                <TableCell>{transaction.owner}</TableCell>
                <TableCell>{transaction.operation}</TableCell>
                <TableCell className="text-right"><Badge color={"purple"}>{transaction.deadLineBlock}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></>}
        {selectedTab === 2 && <>
        <div className="mt-4 grid xl:grid-cols-2 sm:grid-cols-2">
          <InputGroup>
            <MagnifyingGlassIcon />
            <Input name="searchRandomness" id="searchRandomness" placeholder="Search on-chain randomness" aria-label="Search" />
          </InputGroup>
        </div>
        <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
          <TableHead>
            <TableRow>
              <TableHeader>Block number</TableHeader>
              <TableHeader>Id</TableHeader>
              <TableHeader>Randomness</TableHeader>
              <TableHeader className="text-right">Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {generatedRandomness.map((transaction) => (
              <TableRow key={transaction.cid} href={"#"} title={`Transaction #${transaction.cid}`}>
                <TableCell>{transaction.block}</TableCell>
                <TableCell className="text-zinc-500">{transaction.cid}</TableCell>
                <TableCell>{transaction.randomness}</TableCell>
                <TableCell className="text-right"><Badge color={"lime"}>{transaction.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></>}
    </>
  )
}
