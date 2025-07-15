"use client"

import { Button } from "@/components/button"
import Link from "next/link"
import { PlusIcon, BoltIcon } from "@heroicons/react/20/solid"
import { useSubscription } from "@/components/contexts/subscriptionContext"
import { domainToUiSubscription } from "@/utils/subscriptionMapper"
import { useConnectedWallet } from "@/components/contexts/connectedWalletContext"
import { ConnectWallet } from "@/components/idn/connectWallet"
import React, { useState, useEffect } from "react"
import { UiSubscription } from "./types/UiSubscription"

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
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8 flex items-center justify-center">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Please connect your wallet to view your subscriptions</h2>
            <ConnectWallet buttonOnly={true} />
          </div>
        </div>
      </main>
    );
  }
  
  return (
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Subscriptions</h1>
            <Link href="/subscriptions/new">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                New Subscription
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-xl text-zinc-500 mb-4">Loading subscriptions...</p>
              </div>
            ) : error ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-xl text-red-500 mb-4">Error loading subscriptions: {error}</p>
              </div>
            ) : uiSubscriptions.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <BoltIcon className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                <p className="text-xl text-zinc-500 mb-4">No subscriptions found</p>
                <Link href="/subscriptions/new">
                  <Button>Create your first subscription</Button>
                </Link>
              </div>
            ) : (
              uiSubscriptions.map((sub) => (
                <div key={sub.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {sub.name || `Randomness Subscription`}
                        </h2>
                        <p className="text-xs text-zinc-400 font-mono">{sub.id.slice(0, 16)}...</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        sub.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" : 
                        sub.status === "paused" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Credit Usage Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-500">Credits Used</span>
                        <span className="font-medium">{sub.creditsConsumed} / {sub.totalCredits}</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${sub.totalCredits > 0 ? (sub.creditsConsumed / sub.totalCredits) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400 mt-1">
                        <span>{sub.creditsRemaining} remaining</span>
                        <span>{sub.totalCredits > 0 ? Math.round((sub.creditsConsumed / sub.totalCredits) * 100) : 0}% used</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Frequency:</span>
                        <span>Every {sub.frequency} blocks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Target:</span>
                        <span className="text-xs font-mono truncate" title={sub.xcmLocation}>{sub.xcmLocation}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Call Index:</span>
                        <span className="text-xs font-mono">Pallet {sub.callIndex.pallet}, Call {sub.callIndex.call}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
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
  )
}
