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

// Import the use hook for Promise-based params
import { use } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/description-list';
import { Link } from '@/components/link';
import { CommandLineIcon, CubeIcon, WalletIcon } from '@heroicons/react/16/solid';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { notFound } from 'next/navigation';

export default function ExecutedTransaction(props: { params: Promise<{ id: string[] }> }) {
  // Unwrap Promise-based params using React's use() hook
  const params = use(props.params);
  const { executedTransactions } = useConnectedWallet();

  // Direct access to params.id since we're already using the use() hook
  const id = params.id;

  // Check if id exists
  if (!id || !id[0]) {
    notFound();
  }

  const idComponents = id[0].split('_OP_');
  if (idComponents?.length < 2) notFound();

  const transaction = executedTransactions.find(
    tx => tx.id === idComponents[0] && tx.operation === idComponents[1]
  );
  if (!transaction) notFound();

  return transaction ? (
    <main className="w-full flex-1">
      <div className="w-full px-8 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center">
            <Link href={id[1] === 'compose' ? '/timelock' : '/network-activity'} className="mr-4">
              <Button className="rounded-full p-2">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Transaction #{transaction.id}</h1>
              <div className="mt-1 flex items-center">
                <Badge color={transaction.status === 'Confirmed' ? 'lime' : 'red'}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
              <p className="text-sm text-zinc-500">Information about this transaction</p>
            </div>

            <div className="px-6 py-5">
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                  <CommandLineIcon className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm">{transaction.operation}</span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                  <WalletIcon className="h-4 w-4 text-zinc-500" />
                  <span className="max-w-xs truncate text-sm">{transaction.owner}</span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                  <CubeIcon className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm">Block #{transaction.block}</span>
                </div>
              </div>

              {/* Basic transaction info */}
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Transaction type
                  </h3>
                  <p className="text-sm">{transaction.operation}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Block</h3>
                  <p className="text-sm">{transaction.block}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Owner</h3>
                  <p className="break-all text-sm">{transaction.owner}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Metadata
                  </h3>
                  {transaction?.metadata?.map((metadata: any, index: number) => (
                    <p key={`metadata-${index}`} className="whitespace-pre-wrap break-all text-sm">
                      {metadata}
                    </p>
                  ))}
                </div>
              </div>

              {/* Event data section */}
              <div className="mb-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Event data
                </h3>

                {transaction?.eventData?.map((eventData: any, index: number) => {
                  // Get raw string value
                  let displayValue = '';

                  try {
                    if (typeof eventData.value === 'object') {
                      displayValue = JSON.stringify(eventData.value, null, 2);
                    } else {
                      displayValue = String(eventData.value || '');
                    }
                  } catch (e) {
                    displayValue = String(eventData.value || '');
                  }

                  return (
                    <div key={`event-${index}`} className="mb-4 last:mb-0">
                      <div className="mb-2 rounded-sm border-l-2 border-zinc-400 bg-zinc-100 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800">
                        <p className="text-xs font-medium">{eventData.type}</p>
                      </div>
                      <div className="rounded border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                        <code className="block w-full whitespace-pre-wrap break-all font-mono text-xs">
                          {displayValue}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  ) : (
    <main className="w-full flex-1">
      <div className="flex w-full items-center justify-center px-8 py-8">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold">Loading transaction details...</h2>
          <div className="mx-auto h-6 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    </main>
  );
}
