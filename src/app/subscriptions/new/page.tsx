"use client"

import { Button } from "@/components/button"
import { Input } from "@/components/input"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/20/solid"
import { useConnectedWallet } from "@/components/contexts/connectedWalletContext"
import { ConnectWallet } from "@/components/timelock/connectWallet"

export default function NewSubscriptionPage() {
  // Simple feedback state
  const [feedback, setFeedback] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { signer, isConnected } = useConnectedWallet();

  const handleCreateSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const parachainId = parseInt(formData.get("parachainId") as string)
    const duration = parseInt(formData.get("duration") as string)
    const xcmLocation = formData.get("xcmLocation") as string
    const frequency = parseInt(formData.get("frequency") as string)

    // Simulate subscription creation
    setTimeout(() => {
      setLoading(false)
      // Show success message in console
      console.log(`Subscription "${name}" created successfully`)
      // In a real app, we would show a toast message
      router.push("/subscriptions")
    }, 1500)
  }

  if (!signer || !isConnected) {
    return (
      <main className="flex-1 w-full">
        <div className="w-full px-8 py-8 flex items-center justify-center">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Please connect your wallet to create a new subscription</h2>
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
              <Link href="/subscriptions" className="mr-4">
                <Button className="p-2 rounded-full">
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Create New Subscription</h1>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <form onSubmit={handleCreateSubscription}>
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="text-xl font-semibold">Subscription Details</h2>
                  <p className="text-sm text-zinc-500">
                    Fill in the details to create a new randomness subscription
                  </p>
                </div>
                
                <div className="px-6 py-5 space-y-4">
                  <div className="space-y-2">
                    <label 
                      htmlFor="name" 
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Subscription Name
                    </label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="Enter a name for your subscription" 
                    />
                    <p className="text-sm text-zinc-500">
                      A descriptive name to identify this subscription
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label 
                      htmlFor="parachainId" 
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Parachain ID
                    </label>
                    <Input 
                      id="parachainId" 
                      name="parachainId" 
                      type="number"
                      required 
                      min="2000"
                      max="2999"
                      placeholder="Enter your parachain ID (2000-2999)" 
                    />
                    <p className="text-sm text-zinc-500">
                      The ID of your parachain in the Polkadot network (2000-2999)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label 
                      htmlFor="duration" 
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Duration (blocks)
                    </label>
                    <Input 
                      id="duration" 
                      name="duration" 
                      type="number" 
                      required 
                      min="1"
                      placeholder="Enter duration in blocks" 
                    />
                    <p className="text-sm text-zinc-500">
                      How many blocks you want to receive randomness for
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label 
                      htmlFor="frequency" 
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Frequency (blocks)
                    </label>
                    <Input 
                      id="frequency" 
                      name="frequency" 
                      type="number" 
                      required 
                      min="1"
                      placeholder="Enter frequency in blocks" 
                    />
                    <p className="text-sm text-zinc-500">
                      How often (in blocks) you want to receive new random values
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label 
                      htmlFor="xcmLocation" 
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Target XCM Location
                    </label>
                    <Input 
                      id="xcmLocation" 
                      name="xcmLocation" 
                      required 
                      placeholder="Enter XCM location" 
                    />
                    <p className="text-sm text-zinc-500">
                      The XCM location where randomness will be delivered
                    </p>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                  <Link href="/subscriptions">
                    <Button type="button">Cancel</Button>
                  </Link>
                  <Button disabled={loading} type="submit">
                    {loading && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                    Create Subscription
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
  )
}
