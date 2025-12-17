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

// Required for tsyringe dependency injection
import 'reflect-metadata';

import { Badge } from '@/components/badge';
import { Checkbox, CheckboxField } from '@/components/checkbox';
import {
  NUMBER_BLOCKS_EXECUTED,
  useConnectedWallet,
} from '@/components/contexts/connectedWalletContext';
import { Divider } from '@/components/divider';
import { Label } from '@/components/fieldset';
import { Heading } from '@/components/heading';
import { Input, InputGroup } from '@/components/input';
import { Navbar, NavbarItem, NavbarSection } from '@/components/navbar';
import { Pagination, PaginationNext, PaginationPrevious } from '@/components/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table';
import { Randomness } from '@/domain/Randomness';
import { container } from '@/lib/di-container';
import { DrandService } from '@/services/DrandService';
import { ISubscriptionService } from '@/services/ISubscriptionService';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { formatNumber } from '@polkadot/util';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function Stat({
  title,
  value,
  change,
  helpText,
}: {
  readonly title: string;
  readonly value: string;
  readonly change: string;
  readonly helpText?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</h3>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {change} {helpText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 8;

export default function NetworkActivityPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const {
    latestBlock,
    executedTransactions,
    scheduledTransactions,
    generatedRandomness,
    sessionIndex,
    sessionProgress,
    sessionLength,
    delayedOnly,
    setDelayedOnly,
    searchTermExecuted,
    setSearchTermExecuted,
    searchTermScheduled,
    setSearchTermScheduled,
  } = useConnectedWallet();
  const [executedTxPage, setExecutedTxPage] = useState<number>(0);
  const [scheduledTxPage, setScheduledTxPage] = useState<number>(0);
  const [randomnessPage, setRandomnessPage] = useState<number>(0);
  // Provide a fallback URLSearchParams object if searchParams is null
  const searchParams = useSearchParams() || new URLSearchParams();
  const [copyStatus, setCopyStatus] = useState(false); // To indicate if the text was copied
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [drandService] = useState(() => new DrandService());
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [subscriptionsCount, setSubscriptionsCount] = useState<number | null>(null);

  // Transform randomness data for the chart (reverse to show oldest first, limit to last 50)
  // Shows cumulative count of randomness values generated
  const chartData = useMemo(() => {
    const reversed = [...generatedRandomness].slice(0, 50).reverse();
    return reversed.map((entry, index) => ({
      block: entry.block,
      cumulativeCount: index + 1,
      totalCount: reversed.length,
    }));
  }, [generatedRandomness]);

  const onCopyText = () => {
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000); // Reset status after 2 seconds
  };

  // Fetch subscriptions count
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptionService = container.resolve<ISubscriptionService>('ISubscriptionService');
        const allSubscriptions = await subscriptionService.getAllSubscriptions();
        setSubscriptionsCount(allSubscriptions.length);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      }
    };

    fetchSubscriptions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSubscriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCurrentRound = async () => {
      try {
        const round = await drandService.getCurrentRound();
        setCurrentRound(round);
      } catch (error) {
        console.error('Failed to fetch current drand round:', error);
      }
    };

    fetchCurrentRound();
    // Update every 3 seconds (Quicknet round duration)
    const interval = setInterval(fetchCurrentRound, 3000);
    return () => clearInterval(interval);
  }, [drandService]);

  useEffect(() => {
    async function processParam(paramName: any, setFunction: any, itemsSize: number) {
      try {
        const paramValue = searchParams.get(paramName);
        const pExecutedTxPage = paramValue ? parseInt(paramValue) : 0;
        if (pExecutedTxPage * PAGE_SIZE < itemsSize)
          setFunction(
            pExecutedTxPage * PAGE_SIZE < executedTransactions.length ? pExecutedTxPage : 0
          );
        else if (pExecutedTxPage < 0) setFunction(0);
      } catch (e) {
        setFunction(0);
      }
    }
    processParam('executedTxPage', setExecutedTxPage, executedTransactions.length);
    processParam('scheduledTxPage', setScheduledTxPage, scheduledTransactions.length);
    processParam('randomnessPage', setRandomnessPage, generatedRandomness.length);
    processParam('tab', setSelectedTab, 3);
  }, [searchParams]);

  // Helper function to format the blockHash
  const formatHash = (hash: string) => {
    const start = hash.slice(0, 6);
    const end = hash.slice(-6);
    return `${start}...${end}`;
  };

  return (
    <main className="w-full flex-1">
      <div className="w-full px-8 py-8">
        <h1 className="mb-6 text-3xl font-bold">
          IDN Network Activity Hub <Badge>{`Latest ${NUMBER_BLOCKS_EXECUTED} blocks`}</Badge>
        </h1>
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Stat
            title="Last Block"
            value={latestBlock >= 0 ? `#${formatNumber(latestBlock)}` : '...'}
            change=""
            helpText=""
          />
          <Stat
            title="Drand Round"
            value={currentRound > 0 ? `#${formatNumber(currentRound)}` : '...'}
            change="Quicknet"
            helpText="3s intervals"
          />
          <Stat
            title="Session"
            value={`${sessionIndex !== null && sessionIndex >= 0 ? `#${sessionIndex}` : '...'}${sessionProgress && sessionLength ? ` (${formatNumber((sessionProgress / sessionLength) * 100)}%)` : ''}`}
            change=""
            helpText=""
          />
          <Stat
            title="Subscriptions"
            value={subscriptionsCount !== null ? formatNumber(subscriptionsCount) : '...'}
            change="On the network"
            helpText=""
          />
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Timelocked{' '}
                  <span className="ml-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                    Soon
                  </span>
                </h3>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-6">
            <div className="mb-4">
              <Navbar>
                <NavbarSection>
                  <NavbarItem
                    href="#"
                    onClick={() => setSelectedTab(0)}
                    current={selectedTab === 0}
                  >
                    Randomness
                  </NavbarItem>
                  <NavbarItem
                    href="#"
                    onClick={() => setSelectedTab(1)}
                    current={selectedTab === 1}
                  >
                    Latest Events
                  </NavbarItem>
                  <NavbarItem
                    href="#"
                    onClick={() => setSelectedTab(2)}
                    current={selectedTab === 2}
                  >
                    Timelocked{' '}
                    <span className="ml-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                      Soon
                    </span>
                  </NavbarItem>
                </NavbarSection>
              </Navbar>
            </div>

            {selectedTab === 0 && (
              <>
                {/* Cumulative Randomness Count Chart */}
                {chartData.length > 0 && (
                  <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <h4 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Cumulative Randomness Bridged
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="block"
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            tickFormatter={value => `#${formatNumber(value)}`}
                            axisLine={{ stroke: '#3f3f46' }}
                            tickLine={{ stroke: '#3f3f46' }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#71717a' }}
                            axisLine={{ stroke: '#3f3f46' }}
                            tickLine={{ stroke: '#3f3f46' }}
                            allowDecimals={false}
                            domain={[0, 'dataMax']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              border: '1px solid #3f3f46',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                            labelStyle={{ color: '#a1a1aa' }}
                            itemStyle={{ color: '#8b5cf6' }}
                            formatter={(value: number) => [`${value} values`, 'Total']}
                            labelFormatter={label => `Block #${formatNumber(label)}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulativeCount"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#colorCumulative)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
                  <TableHead>
                    <TableRow>
                      <TableHeader>Block</TableHeader>
                      <TableHeader>Rounds</TableHeader>
                      <TableHeader>
                        Signature{' '}
                        {copyStatus && (
                          <Badge color="cyan" className="text-xs text-zinc-500">
                            copied to clipboard!
                          </Badge>
                        )}
                      </TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generatedRandomness
                      .slice(randomnessPage * PAGE_SIZE, (randomnessPage + 1) * PAGE_SIZE)
                      .map((entry: Randomness, index: number) => (
                        <CopyToClipboard
                          key={'copy_' + index}
                          text={entry.randomness}
                          onCopy={onCopyText}
                        >
                          <TableRow
                            key={'row_' + index}
                            className="cursor-pointer"
                            title={`Click to copy randomness from block #${entry.block}`}
                          >
                            <TableCell>{formatNumber(entry.block)}</TableCell>
                            <TableCell>
                              <Badge color="purple">
                                {entry.startRound > 0 || entry.endRound > 0
                                  ? `${formatNumber(entry.startRound)} - ${formatNumber(entry.endRound)}`
                                  : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-wrap">
                              <p className="font-mono text-xs">{entry.randomness}</p>
                            </TableCell>
                          </TableRow>
                        </CopyToClipboard>
                      ))}
                  </TableBody>
                </Table>
                {generatedRandomness.length > PAGE_SIZE && (
                  <Pagination>
                    <PaginationPrevious
                      href={
                        randomnessPage === 0
                          ? `?randomnessPage=0&tab=0`
                          : `?randomnessPage=${randomnessPage - 1}&tab=0`
                      }
                    />
                    <PaginationNext href={`?randomnessPage=${randomnessPage + 1}&tab=0`} />
                  </Pagination>
                )}
              </>
            )}
            {selectedTab === 1 && (
              <>
                <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3">
                  <InputGroup>
                    <MagnifyingGlassIcon />
                    <Input
                      name="searchExecuted"
                      id="searchExecuted"
                      value={searchTermExecuted}
                      onChange={e => setSearchTermExecuted(e.target.value)}
                      placeholder="Search events..."
                      aria-label="Search"
                    />
                  </InputGroup>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3">
                  <CheckboxField>
                    <Checkbox name="delayedOnly" checked={delayedOnly} onChange={setDelayedOnly} />
                    <Label>Delayed transactions only</Label>
                  </CheckboxField>
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
                    {executedTransactions
                      .filter(element => (delayedOnly && element.delayedTx) || !delayedOnly)
                      .filter(
                        element =>
                          searchTermExecuted == '' ||
                          element.id.toLowerCase().includes(searchTermExecuted.toLowerCase()) ||
                          element.operation
                            .toLowerCase()
                            .includes(searchTermExecuted.toLowerCase()) ||
                          element.owner.toLowerCase().includes(searchTermExecuted.toLowerCase())
                      )
                      .slice(executedTxPage * PAGE_SIZE, (executedTxPage + 1) * PAGE_SIZE)
                      .map((transaction, index) => (
                        <TableRow
                          key={index + '_' + transaction.id + '_' + transaction.operation}
                          href={`/timelock/${transaction.id}_OP_${transaction.operation}`}
                          title={`Transaction #${transaction.id}`}
                        >
                          <TableCell>{formatNumber(transaction.block)}</TableCell>
                          <TableCell className="text-zinc-500">{transaction.id}</TableCell>
                          <TableCell>{transaction.owner}</TableCell>
                          <TableCell>{transaction.operation}</TableCell>
                          <TableCell className="text-right">
                            <Badge color={transaction.status === 'Confirmed' ? 'lime' : 'red'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {executedTransactions
                  .filter(element => (delayedOnly && element.delayedTx) || !delayedOnly)
                  .filter(
                    element =>
                      searchTermExecuted == '' ||
                      element.id.toLowerCase().includes(searchTermExecuted.toLowerCase()) ||
                      element.operation.toLowerCase().includes(searchTermExecuted.toLowerCase()) ||
                      element.owner.toLowerCase().includes(searchTermExecuted.toLowerCase())
                  ).length > PAGE_SIZE && (
                  <Pagination>
                    <PaginationPrevious
                      href={
                        executedTxPage === 0
                          ? `?executedTxPage=0&tab=1`
                          : `?executedTxPage=${executedTxPage - 1}&tab=1`
                      }
                    />
                    <PaginationNext href={`?executedTxPage=${executedTxPage + 1}&tab=1`} />
                  </Pagination>
                )}
              </>
            )}
            {selectedTab === 2 && (
              <>
                <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-2">
                  <InputGroup>
                    <MagnifyingGlassIcon />
                    <Input
                      name="searchScheduled"
                      id="searchScheduled"
                      value={searchTermScheduled}
                      onChange={e => setSearchTermScheduled(e.target.value)}
                      placeholder="Search timelocked txs"
                      aria-label="Search"
                    />
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
                    {scheduledTransactions
                      .filter(
                        element =>
                          searchTermScheduled == '' ||
                          element.id.toLowerCase().includes(searchTermScheduled.toLowerCase()) ||
                          element.operation
                            .toLowerCase()
                            .includes(searchTermScheduled.toLowerCase()) ||
                          element.owner.toLowerCase().includes(searchTermScheduled.toLowerCase())
                      )
                      .slice(scheduledTxPage * PAGE_SIZE, (scheduledTxPage + 1) * PAGE_SIZE)
                      .map(transaction => (
                        <TableRow key={transaction.id} title={`Transaction #${transaction.id}`}>
                          <TableCell className="text-zinc-500">{transaction.id}</TableCell>
                          <TableCell>{formatHash(transaction.owner)}</TableCell>
                          <TableCell>{transaction.operation}</TableCell>
                          <TableCell className="text-right">
                            <Badge color={'purple'}>{transaction.deadlineBlock}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {scheduledTransactions.length > PAGE_SIZE && (
                  <Pagination>
                    <PaginationPrevious
                      href={
                        scheduledTxPage === 0
                          ? `?scheduledTxPage=0&tab=2`
                          : `?scheduledTxPage=${scheduledTxPage - 1}&tab=2`
                      }
                    />
                    <PaginationNext href={`?scheduledTxPage=${scheduledTxPage + 1}&tab=2`} />
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
