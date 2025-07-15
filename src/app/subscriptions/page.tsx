'use client';

import { Button } from '@/components/button';
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext';
import { useSubscription } from '@/components/contexts/subscriptionContext';
import { ConnectWallet } from '@/components/idn/connectWallet';
import { domainToUiSubscription } from '@/utils/subscriptionMapper';
import { BoltIcon, PlusIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { UiSubscription } from './types/UiSubscription';

export default function SubscriptionsPage() {
  const { subscriptions, refreshSubscriptions, loading, error } = useSubscription();
  const { signer, signerAddress, isConnected } = useConnectedWallet();
  const [uiSubscriptions, setUiSubscriptions] = useState<UiSubscription[]>([]);

  // Convert domain subscriptions to UI subscriptions when dependencies change
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const mappedSubscriptions = subscriptions.map(domainToUiSubscription);
      setUiSubscriptions(mappedSubscriptions);
    } else {
      setUiSubscriptions([]);
    }
  }, [subscriptions]);

  useEffect(() => {
    if (!signerAddress) return;
    refreshSubscriptions(signerAddress);
  }, [signerAddress]);

  if (!signer || !isConnected) {
    return (
      <main className="w-full flex-1">
        <div className="flex w-full items-center justify-center px-8 py-8">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold">
              Please connect your wallet to view your subscriptions
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Subscriptions</h1>
          <Link href="/subscriptions/new">
            <Button>
              <PlusIcon className="mr-2 h-5 w-5" />
              New Subscription
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <p className="mb-4 text-xl text-zinc-500">Loading subscriptions...</p>
            </div>
          ) : error ? (
            <div className="col-span-full py-12 text-center">
              <p className="mb-4 text-xl text-red-500">Error loading subscriptions: {error}</p>
            </div>
          ) : uiSubscriptions.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <BoltIcon className="mx-auto mb-4 h-16 w-16 text-zinc-300" />
              <p className="mb-4 text-xl text-zinc-500">No subscriptions found</p>
              <Link href="/subscriptions/new">
                <Button>Create your first subscription</Button>
              </Link>
            </div>
          ) : (
            uiSubscriptions.map(sub => (
              <div
                key={sub.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {sub.name || `Randomness Subscription`}
                      </h2>
                      <p className="font-mono text-xs text-zinc-400">{sub.id.slice(0, 16)}...</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                          : sub.status === 'paused'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  </div>

                  {/* Credit Usage Progress */}
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-zinc-500">Credits Used</span>
                      <span className="font-medium">
                        {sub.creditsConsumed} / {sub.totalCredits}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${sub.totalCredits > 0 ? (sub.creditsConsumed / sub.totalCredits) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-zinc-400">
                      <span>{sub.creditsRemaining} remaining</span>
                      <span>
                        {sub.totalCredits > 0
                          ? Math.round((sub.creditsConsumed / sub.totalCredits) * 100)
                          : 0}
                        % used
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Frequency:</span>
                      <span>Every {sub.frequency} blocks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Target:</span>
                      <span className="truncate font-mono text-xs" title={sub.xcmLocation}>
                        {sub.xcmLocation}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Call Index:</span>
                      <span className="font-mono text-xs">
                        Pallet {sub.callIndex.pallet}, Call {sub.callIndex.call}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link href={`/subscriptions/${sub.id}`}>
                      <Button>Manage</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
