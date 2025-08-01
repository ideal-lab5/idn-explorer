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

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext';
import { ConnectWallet } from '@/components/idn/connectWallet';
import { DynamicExtrinsicForm } from '@/components/idn/dynamicExtrinsicForm';
import { Input } from '@/components/input';
import { Link } from '@/components/link';
import { DelayedTransactionDetails } from '@/domain/DelayedTransactionDetails';
import { explorerClient } from '@/lib/explorer-client';
import { ArrowLeftIcon, ArrowPathIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const FUTURE_BLOCK_DEFAULT_START: number = 100;

export default function ScheduleTransaction() {
  const router = useRouter();
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
      setLastError('Please enter a valid future block number.');
      return;
    }

    setIsProcessing(true);

    if (extrinsicData) {
      setLastError(null);
      try {
        await explorerClient?.scheduleTransaction(signer, extrinsicData);
        router.push(`/timelock`);
      } catch (error: any) {
        setLastError(error.message);
      }
    }

    setIsProcessing(false);
  }

  if (!signer || !isConnected) {
    return (
      <main className="w-full flex-1">
        <div className="flex w-full items-center justify-center px-8 py-8">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold">
              Please connect your wallet to schedule transactions
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
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center">
            <Link href="/timelock" className="mr-4">
              <Button className="rounded-full p-2">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              Schedule New Transaction <Badge color="lime">New</Badge>
            </h1>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <h2 className="text-xl font-semibold">Transaction Details</h2>
              <p className="text-sm text-zinc-500">
                Configure when and how your transaction will be executed
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
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
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircleIcon aria-hidden="true" className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                        There was an error with your submission
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>{lastError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <Link href="/timelock">
                <Button type="button">Cancel</Button>
              </Link>
              <Button
                disabled={extrinsicData === null || isProcessing}
                type="button"
                onClick={() => handleScheduleTransaction()}
              >
                {isProcessing && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processing...' : 'Schedule Transaction'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
