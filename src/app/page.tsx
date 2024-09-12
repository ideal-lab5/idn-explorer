'use client'

import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Navbar, NavbarItem, NavbarSection } from '@/components/navbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'
import "reflect-metadata";
import { container } from "tsyringe";
import { ExplorerService } from '@/services/ExplorerService'
import { Randomness } from '@/domain/Randomness'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { formatNumber } from '@polkadot/util'
import { ExecutedTransaction } from '@/domain/ExecutedTransaction'
import { DelayedTransaction } from '@/domain/DelayedTransaction'

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
  const explorerServiceInstance = container.resolve(ExplorerService);
  let [executedTransactions, setExecutedTransactions] = useState<ExecutedTransaction[]>([]);
  let [scheduledTransactions, setScheduledTransactions] = useState<DelayedTransaction[]>([]);
  let [generatedRandomness, setGeneratedRandomness] = useState<Randomness[]>([]);
  let [latestBlock, setLatestBlock] = useState<number>(-1);
  let [selectedTab, setSelectedTab] = useState(0);

  const [epochIndex, setEpochIndex] = useState<number | null>(null);
  const [sessionProgress, setSessionProgress] = useState<number | null>(null);
  const [sessionLength, setSessionLength] = useState<number | null>(null);
  const [eraProgress, setEraProgress] = useState<number | null>(null);
  const [sessionsPerEra, setSessionsPerEra] = useState<number | null>(null);

  useEffect(() => {

    async function subscribeToLatestBlock() {
      const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_NODE_WS || 'wss://rpc.polkadot.io');
      const api = await ApiPromise.create({ provider: wsProvider });
      await api.isReady;

      // Subscribe to new block headers
      await api.rpc.chain.subscribeNewHeads(async (lastHeader) => {

        // Get the current epoch index
        const epochInfo = await api.query.babe.epochIndex();
        const progress = await api.derive.session.progress();
        // Get session and era progress
        setSessionProgress(progress.sessionProgress.toNumber());
        setSessionLength(progress.sessionLength.toNumber());
        setEraProgress(progress.eraProgress.toNumber());
        setSessionsPerEra(progress.sessionsPerEra.toNumber());
        setEpochIndex(epochInfo.toNumber());

        const blockNumber = lastHeader.number.toNumber();
        const blockHash = lastHeader.hash.toHex();
        // Set block number and hash in state
        setLatestBlock(blockNumber);
        const sizeRandomness: number = 13;
        explorerServiceInstance.getRandomness(blockNumber, sizeRandomness).then((result) => {
          setGeneratedRandomness(result);
        });
        const sizeEvents: number = 50;
        explorerServiceInstance.queryHistoricalEvents(blockNumber > sizeEvents ? blockNumber - sizeEvents : 0, blockNumber).then((result) => {
          setExecutedTransactions(result);
        });
        explorerServiceInstance.getScheduledTransactions().then((result) => {
          setScheduledTransactions(result);
        });
      });
    }

    subscribeToLatestBlock();

  }, []);

  // Helper function to format the blockHash
  const formatHash = (hash: string) => {
    const start = hash.slice(0, 6);
    const end = hash.slice(-6);
    return `${start}...${end}`;
  };

  return (
    <>
      <Heading>The Ideal Network Explorer</Heading>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Last Block" value={latestBlock >= 0 ? `#${formatNumber(latestBlock)}` : "..."} change="1.2s" helpText="target 6s" />
        <Stat title="Epoch" value={`${sessionProgress && sessionLength ? formatNumber((sessionProgress / sessionLength) * 100) + "%" : "..."}`} change="4h 48m 36s" />
        <Stat title="Executed" value="100" change="+4.5%" />
        <Stat title="Scheduled" value="148" change="+21.2%" />
      </div>
      {/* <div>
        <h2>Epoch Information</h2>
        <p>Current Epoch: {epochIndex}</p>
        <p>Era Progress: {eraProgress}/{sessionsPerEra}</p>
      </div> */}
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
              <TableHeader>Block</TableHeader>
              <TableHeader>Id</TableHeader>
              <TableHeader>Owner</TableHeader>
              <TableHeader>Operation</TableHeader>
              <TableHeader className="text-right">Result</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {executedTransactions.map((transaction, index) => (
              <TableRow key={index} href={`/compose/${transaction.id}`} title={`Transaction #${transaction.id}`}>
                <TableCell>{transaction.block}</TableCell>
                <TableCell className="text-zinc-500">{transaction.id}</TableCell>
                <TableCell>{formatHash(transaction.owner)}</TableCell>
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
              <TableHeader>Block</TableHeader>
              {/* <TableHeader>Signature</TableHeader> */}
              <TableHeader>Randomness</TableHeader>
              {/* <TableHeader className="text-right">Status</TableHeader> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {generatedRandomness.map((transaction: Randomness, index: number) => (
              <TableRow key={index} href={"#"} title={`Transaction #${index}`}>
                <TableCell>{transaction.block}</TableCell>
                {/* <TableCell className="text-zinc-500 truncate">{`${formatHash(transaction.signature)}`}</TableCell> */}
                <TableCell className="text-wrap"><p>{transaction.randomness}</p></TableCell>
                {/* <TableCell className="text-right"><Badge color={"lime"}>{transaction.status}</Badge></TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table></>}
    </>
  )
}
