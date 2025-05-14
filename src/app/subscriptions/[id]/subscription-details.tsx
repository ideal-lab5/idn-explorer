"use client"

import { Button } from "@/components/button"
import {
  ArrowLeftIcon,
  PlayIcon, 
  PauseIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon
} from "@heroicons/react/20/solid"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { DummySubscription } from "./data"
import { useConnectedWallet } from "@/components/contexts/connectedWalletContext"
import { ConnectWallet } from "@/components/timelock/connectWallet"

interface SubscriptionDetailsProps {
  id: string;
  subscription: DummySubscription;
}

export function SubscriptionDetails({ id, subscription }: SubscriptionDetailsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{message: string, visible: boolean} | null>(null)
  const router = useRouter()
  const { signer, isConnected } = useConnectedWallet()

  const handleAction = (action: "pause" | "resume" | "cancel") => {
    // In a real application, this would call an API
    setTimeout(() => {
      if (action === "cancel") {
        router.push("/subscriptions")
      } else {
        router.refresh()
      }
    }, 500)
  }

  if (!signer || !isConnected) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <Link href="/subscriptions" className="mr-4">
            <Button className="p-2 rounded-full">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{subscription.name}</h1>
            <p className="text-zinc-500">Parachain {subscription.parachainId} • ID: {id}</p>
          </div>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Please connect your wallet to manage this subscription</h2>
          <ConnectWallet buttonOnly={true} />
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/subscriptions" className="mr-4">
          <Button className="p-2 rounded-full">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{subscription.name}</h1>
          <p className="text-zinc-500">Parachain {subscription.parachainId} • ID: {id}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Subscription Status</h2>
            <p className="text-sm text-zinc-500">Current status and details of your subscription</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Status</p>
                <p className={`font-medium ${
                  subscription.status === "active" ? "text-emerald-600 dark:text-emerald-400" :
                  subscription.status === "paused" ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400"
                }`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Created On</p>
                <p className="font-medium">{subscription.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Duration</p>
                <p className="font-medium">{subscription.duration.toLocaleString()} blocks</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Frequency</p>
                <p className="font-medium">Every {subscription.frequency.toLocaleString()} blocks</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Balance</p>
                <p className="font-medium">{subscription.remainingAmount.toLocaleString()} tokens</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">XCM Location</p>
                <p className="font-medium font-mono text-sm break-all">{subscription.xcmLocation}</p>
              </div>
            </div>

            {subscription.status === "active" && subscription.lastRandomValue && (
              <div>
                <p className="text-sm text-zinc-500 mb-1">Latest Random Value</p>
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-md text-sm font-mono break-all">
                  {subscription.lastRandomValue}
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            {subscription.status === "active" ? (
              <Button
                onClick={() => handleAction("pause")}
              >
                <PauseIcon className="h-4 w-4 mr-2" /> Pause Subscription
              </Button>
            ) : subscription.status === "paused" ? (
              <Button
                onClick={() => handleAction("resume")}
              >
                <PlayIcon className="h-4 w-4 mr-2" /> Resume Subscription
              </Button>
            ) : null}
            
            <Button
              onClick={() => setIsDialogOpen(true)}
            >
              <XMarkIcon className="h-4 w-4 mr-2" /> Cancel Subscription
            </Button>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Delivery History</h2>
            <p className="text-sm text-zinc-500">Recent activity for this subscription</p>
          </div>
          <div className="px-6 py-5">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-3 gap-4 p-4 font-medium border-b border-zinc-200 dark:border-zinc-700">
                <div>Date</div>
                <div>Block</div>
                <div>Tokens Used</div>
              </div>
              {subscription.usageHistory.map((usage, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-700 last:border-0">
                  <div>{usage.date}</div>
                  <div>{usage.blocks}</div>
                  <div>{usage.tokens}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cancel Confirmation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-2" />
                <h3 className="text-lg font-semibold">Cancel Subscription</h3>
              </div>
              <p className="mb-4">
                Are you sure you want to cancel this subscription? This action cannot be undone,
                and any remaining tokens will be forfeited.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                >
                  Keep Subscription
                </Button>
                <Button
                  onClick={() => handleAction("cancel")}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
