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
import { useConnectedWallet } from '@/components/etf/ConnectedWalletContext'
import { useSearchParams } from 'next/navigation'
import {
  Pagination,
  PaginationGap,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from '@/components/pagination'

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

const PAGE_SIZE = 8;
const NUMBER_BLOCKS_EXECUTED = 50;
const RAMDOMNESS_SAMPLE = 33;

export default function Home() {
  const explorerServiceInstance = container.resolve(ExplorerService);
  const [executedTransactions, setExecutedTransactions] = useState<ExecutedTransaction[]>([]);
  const [scheduledTransactions, setScheduledTransactions] = useState<DelayedTransaction[]>([]);
  const [generatedRandomness, setGeneratedRandomness] = useState<Randomness[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [epochIndex, setEpochIndex] = useState<number | null>(null);
  const [sessionProgress, setSessionProgress] = useState<number | null>(null);
  const [sessionLength, setSessionLength] = useState<number | null>(null);
  const [eraProgress, setEraProgress] = useState<number | null>(null);
  const [sessionsPerEra, setSessionsPerEra] = useState<number | null>(null);
  const { latestBlock, setLatestBlock } = useConnectedWallet();
  const [executedTxPage, setExecutedTxPage] = useState<number>(0);
  const [scheduledTxPage, setScheduledTxPage] = useState<number>(0);
  const [randomnessPage, setRandomnessPage] = useState<number>(0);
  const searchParams = useSearchParams()


  useEffect(() => {

    async function processParam(paramName: any, setFunction: any, itemsSize: number) {
      try {
        const pExecutedTxPage = searchParams.get(paramName) && parseInt(searchParams.get(paramName) as string) || 0;
        if (pExecutedTxPage * PAGE_SIZE < itemsSize)
          setFunction(pExecutedTxPage * PAGE_SIZE < executedTransactions.length ? pExecutedTxPage : 0);
        else if (pExecutedTxPage < 0)
          setFunction(0);
      } catch (e) {
        setFunction(0);
      }
    };
    processParam("executedTxPage", setExecutedTxPage, executedTransactions.length);
    processParam("scheduledTxPage", setScheduledTxPage, scheduledTransactions.length);
    processParam("randomnessPage", setRandomnessPage, generatedRandomness.length);
    processParam("tab", setSelectedTab, 3);

  }, [searchParams]);

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
        setLatestBlock(blockNumber);
        explorerServiceInstance.getRandomness(blockNumber, RAMDOMNESS_SAMPLE).then((result) => {
          setGeneratedRandomness(result);
        });
        explorerServiceInstance.queryHistoricalEvents(blockNumber > NUMBER_BLOCKS_EXECUTED ? blockNumber - NUMBER_BLOCKS_EXECUTED : 0, blockNumber).then((result) => {
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
        <Stat title="Executed" value={formatNumber(executedTransactions.length)} change={`Last ${NUMBER_BLOCKS_EXECUTED} blocks`} helpText="" />
        <Stat title="Scheduled" value={formatNumber(scheduledTransactions.length)} change="Upcoming txs" helpText="" />
      </div>
      {/* <div>
        <h2>Epoch Information</h2>
        <p>Current Epoch: {epochIndex}</p>
        <p>Era Progress: {eraProgress}/{sessionsPerEra}</p>
      </div> */}
      <Subheading className="mt-5"><Badge color="lime">Transactions</Badge></Subheading>
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
            {executedTransactions.slice(executedTxPage * PAGE_SIZE, (executedTxPage + 1) * PAGE_SIZE).map((transaction, index) => (
              <TableRow key={index} href={`/compose/${transaction.id}`} title={`Transaction #${transaction.id}`}>
                <TableCell>{transaction.block}</TableCell>
                <TableCell className="text-zinc-500">{transaction.id}</TableCell>
                <TableCell>{formatHash(transaction.owner)}</TableCell>
                <TableCell>{transaction.operation}</TableCell>
                <TableCell className="text-right"><Badge color={transaction.status === "Confirmed" ? "lime" : "red"}>{transaction.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>{executedTransactions.length > PAGE_SIZE && <Pagination>
          <PaginationPrevious href={executedTxPage === 0 ? `?executedTxPage=0&tab=0` : `?executedTxPage=${executedTxPage - 1}&tab=0`} />
          <PaginationNext href={`?executedTxPage=${executedTxPage + 1}&tab=0`} />
        </Pagination>}</>}
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
              <TableHeader>Id</TableHeader>
              <TableHeader>Owner</TableHeader>
              <TableHeader>Operation</TableHeader>
              <TableHeader className="text-right">Deadline Block</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledTransactions.slice(scheduledTxPage * PAGE_SIZE, (scheduledTxPage + 1) * PAGE_SIZE).map((transaction) => (
              <TableRow key={transaction.id} href={`#`} title={`Transaction #${transaction.id}`}>
                <TableCell className="text-zinc-500">{transaction.id}</TableCell>
                <TableCell>{formatHash(transaction.owner)}</TableCell>
                <TableCell>{transaction.operation}</TableCell>
                <TableCell className="text-right"><Badge color={"purple"}>{transaction.deadlineBlock}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>{scheduledTransactions.length > PAGE_SIZE && <Pagination>
          <PaginationPrevious href={scheduledTxPage === 0 ? `?scheduledTxPage=0&tab=1` : `?scheduledTxPage=${scheduledTxPage - 1}&tab=1`} />
          <PaginationNext href={`?scheduledTxPage=${scheduledTxPage + 1}&tab=1`} />
        </Pagination>}</>}
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
            {generatedRandomness.slice(randomnessPage * PAGE_SIZE, (randomnessPage + 1) * PAGE_SIZE).map((transaction: Randomness, index: number) => (
              <TableRow key={index} href={"#"} title={`Transaction #${index}`}>
                <TableCell>{transaction.block}</TableCell>
                {/* <TableCell className="text-zinc-500 truncate">{`${formatHash(transaction.signature)}`}</TableCell> */}
                <TableCell className="text-wrap"><p>{transaction.randomness}</p></TableCell>
                {/* <TableCell className="text-right"><Badge color={"lime"}>{transaction.status}</Badge></TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>{generatedRandomness.length > PAGE_SIZE && <Pagination>
          <PaginationPrevious href={randomnessPage === 0 ? `?randomnessPage=0&tab=2` : `?randomnessPage=${randomnessPage - 1}&tab=2`} />
          <PaginationNext href={`?randomnessPage=${randomnessPage + 1}&tab=2`} />
        </Pagination>}</>}
    </>
  )
}
