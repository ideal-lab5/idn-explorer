"use client"

import { Button } from "@/components/button"
import { Input } from "@/components/input"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConnectedWallet } from "@/components/contexts/connectedWalletContext"
import { useSubscription } from "@/components/contexts/subscriptionContext"
import { ConnectWallet } from "@/components/idn/connectWallet"
import XcmLocationBuilder, { XcmLocation } from '@/components/xcm/XcmLocationBuilder'
import { ArrowLeftIcon, ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/20/solid"

export default function NewSubscriptionPage() {
  // State for form feedback and loading
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [xcmLocation, setXcmLocation] = useState<XcmLocation>({
    parents: 1,
    interior: { x1: [{ type: 'parachain', value: { parachain: 2000 } }] }
  })
  const { signer, isConnected } = useConnectedWallet();
  const { createSubscription } = useSubscription();

  const handleCreateSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get("name") as string
      const credits = formData.get("credits") as string
      const frequency = formData.get("frequency") as string
      
      // Extract call index parameters
      const palletIndex = parseInt(formData.get("palletIndex") as string)
      const callIndexValue = parseInt(formData.get("callIndex") as string)
      
      // Build call index array
      const callIndex: [number, number] = [palletIndex, callIndexValue]
      
      // Create the subscription using the service
      await createSubscription(
        signer,
        parseInt(credits),
        xcmLocation,
        callIndex,
        parseInt(frequency), 
        name // Using name as metadata
      )
      
      // Use Next.js router for navigation to maintain client-side state
      // This preserves the wallet connection state
      router.push('/subscriptions')
      
    } catch (err) {
      console.error('Failed to create subscription:', err)
      setFeedback({
        message: `Failed to create subscription: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error'
      })
      setLoading(false)
    }
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
                      htmlFor="credits" 
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Credits (Random Values)
                    </label>
                    <Input 
                      id="credits" 
                      name="credits" 
                      type="number" 
                      required 
                      min="1"
                      placeholder="Enter number of random values" 
                    />
                    <p className="text-sm text-zinc-500">
                      Total number of random values you want to receive
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
                  
                  {/* XCM Location Configuration */}
                  <div className="space-y-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      XCM Target Configuration
                    </h3>
                    <p className="text-sm text-zinc-500 mb-4">
                      Configure the target location for your subscription using XCM multilocation format
                    </p>
                    
                    <XcmLocationBuilder 
                      value={xcmLocation}
                      onChange={setXcmLocation}
                    />
                  </div>
                  
                  {/* Call Index Configuration */}
                  <div className="space-y-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      XCM Call Index Configuration
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Specifies which pallet and function to call on the target parachain
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label 
                          htmlFor="palletIndex" 
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Pallet Index
                        </label>
                        <Input 
                          id="palletIndex" 
                          name="palletIndex" 
                          type="number" 
                          required 
                          min="0"
                          max="255"
                          defaultValue="42"
                          placeholder="Enter pallet index (0-255)" 
                        />
                        <p className="text-sm text-zinc-500">
                          Index of the target pallet in destination runtime
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label 
                          htmlFor="callIndex" 
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Call Index
                        </label>
                        <Input 
                          id="callIndex" 
                          name="callIndex" 
                          type="number" 
                          required 
                          min="0"
                          max="255"
                          defaultValue="3"
                          placeholder="Enter call index (0-255)" 
                        />
                        <p className="text-sm text-zinc-500">
                          Index of the function within the pallet
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Using auto-generated subscription IDs */}
                </div>
                
                {/* Error/Success message moved to bottom */}
                {feedback && (
                  <div className={`px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 ${feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                    <div className="flex items-center">
                      {feedback.type === 'error' && <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />}
                      {feedback.message}
                    </div>
                  </div>
                )}
                
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
