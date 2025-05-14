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

import { Button } from '@/components/button'
import { Badge } from '@/components/badge'
import { Link } from '@/components/link'
import { Input } from '@/components/input'
import { ArrowLeftIcon, ArrowPathIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { DynamicExtrinsicForm } from '@/components/timelock/dynamicExtrinsicForm'
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext'
import { ConnectWallet } from '@/components/timelock/connectWallet'
import { useState } from 'react'
import { DelayedTransactionDetails } from '@/domain/DelayedTransactionDetails'
import { useRouter } from 'next/navigation'
import { explorerClient } from '@/lib/explorer-client'

const FUTURE_BLOCK_DEFAULT_START: number = 100;

export default function ScheduleTransaction() {

  const router = useRouter()
  const { latestBlock, signer, isConnected } = useConnectedWallet();
  const [block, setBlock] = useState<number>(latestBlock + FUTURE_BLOCK_DEFAULT_START);
  const [extrinsicData, setExtrinsicData] = useState<DelayedTransactionDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  async function handleScheduleTransaction() {

    if (isProcessing || !signer || extrinsicData === null) {
      return;
    }

    if (extrinsicData.block <= latestBlock) {
      setLastError("Please enter a valid future block number.");
      return;
    }

    setIsProcessing(true);

    if (extrinsicData) {
      setLastError(null);
      try {
        await explorerClient?.scheduleTransaction(signer, extrinsicData);
        router.push(`/compose`)
      } catch (error: any) {
        setLastError(error.message);
      }
    }

    setIsProcessing(false);
  }

  if (!signer || !isConnected) {
    return (
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8 flex items-center justify-center">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Please connect your wallet to schedule transactions</h2>
            <ConnectWallet buttonOnly={true} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full">
      <div className="w-full px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Link href="/compose" className="mr-4">
              <Button className="p-2 rounded-full">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Schedule New Transaction <Badge color="lime">New</Badge></h1>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
              <p className="text-sm text-zinc-500">
                Configure when and how your transaction will be executed
              </p>
            </div>
            
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="block" 
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Future Block
                </label>
                <Input 
                  id="block" 
                  name="block" 
                  type="number"
                  value={block} 
                  onChange={e => setBlock(parseInt(e.target.value))} 
                  placeholder="Future Block Number" 
                  autoFocus 
                />
                <p className="text-sm text-zinc-500">
                  Specify the future block number at which you want the transaction to be executed
                </p>
              </div>
              
              <div className="space-y-2">
                <label 
                  htmlFor="extrinsic" 
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Pallet / Extrinsic / Arguments
                </label>
                <DynamicExtrinsicForm setExtrinsicData={setExtrinsicData} block={block} />
                <p className="text-sm text-zinc-500">
                  Select the pallet, extrinsic, and provide all necessary arguments
                </p>
              </div>

              {lastError && (
                <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircleIcon aria-hidden="true" className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-400">There was an error with your submission</h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>{lastError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <Link href="/compose">
                <Button type="button">Cancel</Button>
              </Link>
              <Button 
                disabled={extrinsicData === null || isProcessing}
                type="button" 
                onClick={() => handleScheduleTransaction()}
              >
                {isProcessing && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? "Processing..." : "Schedule Transaction"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
