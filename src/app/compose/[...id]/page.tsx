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

import { Badge } from '@/components/badge'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list'
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext'
import { Link } from '@/components/link'
import { Button } from '@/components/button'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { CommandLineIcon, CubeIcon, WalletIcon } from '@heroicons/react/16/solid'
import { notFound } from 'next/navigation'

export default function ExecutedTransaction({ params }: { readonly params: { readonly id: readonly string[] } }) {

  const {
    executedTransactions
  } = useConnectedWallet();

  if (!params.id[0]) notFound();

  const idComponents = params.id[0].split('_OP_');
  if (idComponents?.length < 2) notFound();

  const transaction = executedTransactions.find((tx) => tx.id === idComponents[0] && tx.operation === idComponents[1]);
  if (!transaction) notFound();

  return (
    transaction ? (
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <Link href={params.id[1] === "compose" ? "/compose" : "/network-activity"} className="mr-4">
                <Button className="p-2 rounded-full">
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Transaction #{transaction.id}</h1>
                <div className="flex items-center mt-1">
                  <Badge color={transaction.status === 'Confirmed' ? 'lime' : 'red'}>{transaction.status}</Badge>
                </div>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-semibold">Transaction Details</h2>
                <p className="text-sm text-zinc-500">Information about this transaction</p>
              </div>
              
              <div className="px-6 py-5">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md">
                    <CommandLineIcon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm">{transaction.operation}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md">
                    <WalletIcon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm truncate max-w-xs">{transaction.owner}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-md">
                    <CubeIcon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm">Block #{transaction.block}</span>
                  </div>
                </div>
                
                {/* Basic transaction info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Transaction type</h3>
                    <p className="text-sm">{transaction.operation}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Block</h3>
                    <p className="text-sm">{transaction.block}</p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Owner</h3>
                    <p className="text-sm break-all">{transaction.owner}</p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Metadata</h3>
                    {transaction?.metadata?.map((metadata: any, index: number) => (
                      <p key={`metadata-${index}`} className="text-sm break-all whitespace-pre-wrap">{metadata}</p>
                    ))}
                  </div>
                </div>
                
                {/* Event data section */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mb-4">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Event data</h3>
                  
                  {transaction?.eventData?.map((eventData: any, index: number) => {
                    // Get raw string value
                    let displayValue = "";
                    
                    try {
                      if (typeof eventData.value === 'object') {
                        displayValue = JSON.stringify(eventData.value, null, 2);
                      } else {
                        displayValue = String(eventData.value || "");
                      }
                    } catch (e) {
                      displayValue = String(eventData.value || "");
                    }
                    
                    return (
                      <div key={`event-${index}`} className="mb-4 last:mb-0">
                        <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border-l-2 border-zinc-400 dark:border-zinc-600 rounded-sm mb-2">
                          <p className="text-xs font-medium">{eventData.type}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-3">
                          <code className="block text-xs font-mono whitespace-pre-wrap break-all w-full">
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
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8 flex items-center justify-center">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Loading transaction details...</h2>
            <div className="animate-pulse h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto"></div>
          </div>
        </div>
      </main>
    )
  );
}
