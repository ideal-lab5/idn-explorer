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
import { Button } from '@/components/button';
import {
  NUMBER_BLOCKS_EXECUTED,
  useConnectedWallet,
} from '@/components/contexts/connectedWalletContext';
import { Divider } from '@/components/divider';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown';
import { Heading } from '@/components/heading';
import { ConnectWallet } from '@/components/idn/connectWallet';
import { Input, InputGroup } from '@/components/input';
import { Link } from '@/components/link';
import { Select } from '@/components/select';
import { explorerClient } from '@/lib/explorer-client';
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

interface LatestError {
  index: number;
  message: string;
  type: string;
}

export default function Compose() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<LatestError | null>(null);

  const {
    signer,
    isConnected,
    executedTransactions,
    scheduledTransactions,
    composeCurrentSelection,
    setComposeCurrentSelection,
    composeCurrentSearchTerm,
    setComposeCurrentSearchTerm,
  } = useConnectedWallet();

  const handleCancelTransaction = async (blockNumber: number, index: number) => {
    if (isProcessing || !signer) {
      return;
    }
    setIsProcessing(true);
    setLastMessage(null);
    try {
      await explorerClient?.cancelTransaction(signer, blockNumber, index);
      setLastMessage({
        index,
        message:
          'Your transaction will be canceled within next few blocks. Keep an eye on My Events.',
        type: 'success',
      });
    } catch (error: any) {
      console.error(error);
      setLastMessage({ index, message: error.message, type: 'error' });
    }
    setIsProcessing(false);
  };

  if (!signer || !isConnected) {
    return (
      <main className="w-full flex-1">
        <div className="flex w-full items-center justify-center px-8 py-8">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold">
              Please connect your wallet to view your transactions
            </h2>
            <ConnectWallet buttonOnly={true} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-1">
      <div className="w-full px-8 py-8">
        <h1 className="mb-6 text-3xl font-bold">My Transactions</h1>

        <div className="mb-8 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium">Transaction Management</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  View and manage your scheduled and executed transactions
                </p>
              </div>
              <Link href={`/timelock/schedule`} aria-hidden="true">
                <Button type="button" className="cursor-pointer" outline>
                  Schedule Transaction
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 flex max-w-xl gap-4">
              <div className="flex-1">
                <InputGroup>
                  <MagnifyingGlassIcon />
                  <Input
                    name="search"
                    value={composeCurrentSearchTerm}
                    onChange={e => setComposeCurrentSearchTerm(e.target.value)}
                    placeholder="Search transactions..."
                  />
                </InputGroup>
              </div>
              <div>
                <Select
                  name="sort_by"
                  value={composeCurrentSelection}
                  onChange={e => setComposeCurrentSelection(e.target.value)}
                >
                  <option value="scheduled">My Scheduled</option>
                  <option value="executed">My Events</option>
                </Select>
                {composeCurrentSelection === 'executed' && (
                  <span className="ml-2 text-xs text-zinc-500">{`Latest ${NUMBER_BLOCKS_EXECUTED} blocks`}</span>
                )}
              </div>
            </div>
            <ul className="space-y-4">
              {composeCurrentSelection === 'executed' &&
                executedTransactions
                  .filter(transaction => transaction.owner === signer.address)
                  .filter(
                    element =>
                      composeCurrentSearchTerm == '' ||
                      element.id.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()) ||
                      element.operation
                        .toLowerCase()
                        .includes(composeCurrentSearchTerm.toLowerCase()) ||
                      element.owner.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase())
                  )
                  .map((transaction, index) => {
                    return (
                      <li
                        key={index + '_' + transaction.id + '_' + transaction.operation}
                        className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                          <div className="flex-shrink-0">
                            <Badge color={transaction.status === 'Confirmed' ? 'lime' : 'red'}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="flex-grow">
                            <div className="text-base font-semibold">{transaction.id}</div>
                            <div className="text-xs text-zinc-500">Block: {transaction.block}</div>
                            <div className="mt-1 text-xs text-zinc-600">
                              <Badge>{transaction.operation}</Badge>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              {composeCurrentSelection === 'scheduled' &&
                scheduledTransactions
                  .filter(transaction => transaction.owner === signer.address)
                  .filter(
                    element =>
                      composeCurrentSearchTerm == '' ||
                      element.id.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()) ||
                      element.operation
                        .toLowerCase()
                        .includes(composeCurrentSearchTerm.toLowerCase()) ||
                      element.owner.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase())
                  )
                  .map((transaction, index) => {
                    return (
                      <li
                        key={index}
                        className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="text-base font-semibold">{transaction.id}</div>
                            <div className="text-xs text-zinc-500">
                              Deadline: {transaction.deadlineBlock}
                            </div>
                            <div className="mt-1 text-xs text-zinc-600">
                              <Badge>{transaction.operation}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className="max-sm:hidden" color={'lime'}>
                              {'Scheduled'}
                            </Badge>
                            <Dropdown>
                              <DropdownButton
                                className="cursor-pointer"
                                plain
                                aria-label="More options"
                              >
                                <EllipsisVerticalIcon />
                              </DropdownButton>
                              <DropdownMenu anchor="bottom end">
                                <DropdownItem
                                  onClick={() =>
                                    handleCancelTransaction(
                                      parseInt(transaction.deadlineBlock),
                                      index
                                    )
                                  }
                                >
                                  {isProcessing ? 'Canceling...' : 'Cancel'}
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                        {lastMessage?.index === index && (
                          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                {lastMessage?.type === 'error' ? (
                                  <XCircleIcon
                                    aria-hidden="true"
                                    className="h-5 w-5 text-rose-400"
                                  />
                                ) : (
                                  <ExclamationTriangleIcon
                                    aria-hidden="true"
                                    className="h-5 w-5 text-yellow-400"
                                  />
                                )}
                              </div>
                              <div className="ml-3">
                                <h3
                                  className={`text-sm font-medium ${lastMessage?.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-yellow-600 dark:text-yellow-400'}`}
                                >
                                  {lastMessage?.message}
                                </h3>
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
              {composeCurrentSelection === 'executed' &&
                !executedTransactions.filter(transaction => transaction.owner === signer.address)
                  .length && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon
                          aria-hidden="true"
                          className="h-5 w-5 text-yellow-400"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          You have no executed transactions.{' '}
                          <Link
                            href={`/timelock/schedule`}
                            aria-hidden="true"
                            className="font-medium text-zinc-700 underline hover:text-zinc-600 dark:text-zinc-300"
                          >
                            Schedule a new transaction.
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              {composeCurrentSelection === 'scheduled' &&
                !scheduledTransactions.filter(transaction => transaction.owner === signer.address)
                  .length && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon
                          aria-hidden="true"
                          className="h-5 w-5 text-yellow-400"
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          You have no upcoming transactions scheduled.{' '}
                          <Link
                            href={`/timelock/schedule`}
                            aria-hidden="true"
                            className="font-medium text-zinc-700 underline hover:text-zinc-600 dark:text-zinc-300"
                          >
                            Schedule a new transaction.
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
