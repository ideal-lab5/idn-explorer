'use client';

import { Button } from '@/components/button';
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext';
import { useSubscription } from '@/components/contexts/subscriptionContext';
import { ConnectWallet } from '@/components/idn/connectWallet';
import { Input } from '@/components/input';
import XcmLocationBuilder, { XcmLocation } from '@/components/xcm/XcmLocationBuilder';
import { encodeContractCall, encodeRuntimeCall } from '@/utils/callDataEncoder';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  DocumentIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SubscriptionType } from '../types/UiSubscription';

export default function NewSubscriptionPage() {
  // State for form feedback and loading
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [xcmLocation, setXcmLocation] = useState<XcmLocation>({
    parents: 1,
    interior: { x1: [{ type: 'parachain', value: { parachain: 2000 } }] },
  });
  const { signer, isConnected } = useConnectedWallet();
  const { createSubscription } = useSubscription();

  // Subscription type state
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('runtime');

  const handleCreateSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const credits = formData.get('credits') as string;
      const frequency = formData.get('frequency') as string;

      let call: string;

      if (subscriptionType === 'runtime') {
        // Build runtime call data
        const palletIndex = parseInt(formData.get('palletIndex') as string);
        const callIndexValue = parseInt(formData.get('callIndex') as string);
        call = encodeRuntimeCall(palletIndex, callIndexValue);
      } else {
        // Build contract call data
        const palletIndex = parseInt(formData.get('contractPalletIndex') as string);
        const callIndexValue = parseInt(formData.get('contractCallIndex') as string);
        const contractAddress = formData.get('contractAddress') as string;
        const value = formData.get('contractValue') as string;
        const gasLimit = formData.get('gasLimit') as string;
        const storageDepositLimit = formData.get('storageDepositLimit') as string;
        const selector = formData.get('selector') as string;

        call = encodeContractCall(
          palletIndex,
          callIndexValue,
          contractAddress,
          value || '0',
          gasLimit,
          storageDepositLimit || null,
          selector
        );
      }

      // Create the subscription using the service
      // Using 'Native' origin kind as requested
      await createSubscription(
        signer,
        parseInt(credits),
        xcmLocation,
        call,
        'Native', // Origin kind set to Native
        parseInt(frequency),
        name // Using name as metadata
      );

      // Use Next.js router for navigation to maintain client-side state
      router.push('/subscriptions');
    } catch (err) {
      console.error('Failed to create subscription:', err);
      setFeedback({
        message: `Failed to create subscription: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      });
      setLoading(false);
    }
  };

  if (!signer || !isConnected) {
    return (
      <main className="w-full flex-1">
        <div className="flex w-full items-center justify-center px-8 py-8">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold">
              Please connect your wallet to create a new subscription
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
            <Link href="/subscriptions" className="mr-4">
              <Button className="rounded-full p-2">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Create New Subscription</h1>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <form onSubmit={handleCreateSubscription}>
              <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
                <h2 className="text-xl font-semibold">Subscription Details</h2>
                <p className="text-sm text-zinc-500">
                  Fill in the details to create a new randomness subscription
                </p>
              </div>

              <div className="space-y-4 px-6 py-5">
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
                <div className="space-y-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    XCM Target Configuration
                  </h3>
                  <p className="mb-4 text-sm text-zinc-500">
                    Configure the target location for your subscription using XCM multilocation
                    format
                  </p>

                  <XcmLocationBuilder value={xcmLocation} onChange={setXcmLocation} />
                </div>

                {/* Subscription Type Selector */}
                <div className="space-y-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                  <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                    Subscription Type
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Choose how randomness will be delivered to your target
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSubscriptionType('runtime')}
                      className={`flex flex-col items-center rounded-lg border-2 p-4 transition-all ${
                        subscriptionType === 'runtime'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                      }`}
                    >
                      <BoltIcon
                        className={`mb-2 h-8 w-8 ${subscriptionType === 'runtime' ? 'text-blue-500' : 'text-zinc-400'}`}
                      />
                      <span
                        className={`font-medium ${subscriptionType === 'runtime' ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300'}`}
                      >
                        Runtime Extrinsic
                      </span>
                      <span className="mt-1 text-center text-xs text-zinc-500">
                        Call a pallet function directly
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubscriptionType('contract')}
                      className={`flex flex-col items-center rounded-lg border-2 p-4 transition-all ${
                        subscriptionType === 'contract'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                      }`}
                    >
                      <DocumentIcon
                        className={`mb-2 h-8 w-8 ${subscriptionType === 'contract' ? 'text-blue-500' : 'text-zinc-400'}`}
                      />
                      <span
                        className={`font-medium ${subscriptionType === 'contract' ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300'}`}
                      >
                        Smart Contract
                      </span>
                      <span className="mt-1 text-center text-xs text-zinc-500">
                        Call a contract function
                      </span>
                    </button>
                  </div>
                </div>

                {/* Runtime Extrinsic Configuration */}
                {subscriptionType === 'runtime' && (
                  <div className="space-y-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      Runtime Call Configuration
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
                          Index of the target pallet (e.g., idn-consumer)
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
                          Index of the function (e.g., consume_pulse)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Contract Configuration */}
                {subscriptionType === 'contract' && (
                  <div className="space-y-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                    <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
                      Contract Call Configuration
                    </h3>
                    <p className="text-sm text-zinc-500">
                      Configure the contract call parameters for randomness delivery
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="contractPalletIndex"
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Contracts Pallet Index
                        </label>
                        <Input
                          id="contractPalletIndex"
                          name="contractPalletIndex"
                          type="number"
                          required
                          min="0"
                          max="255"
                          defaultValue="50"
                          placeholder="Enter pallet index (0-255)"
                        />
                        <p className="text-sm text-zinc-500">Index of the Contracts pallet</p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="contractCallIndex"
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Call Index
                        </label>
                        <Input
                          id="contractCallIndex"
                          name="contractCallIndex"
                          type="number"
                          required
                          min="0"
                          max="255"
                          defaultValue="6"
                          placeholder="Enter call index (0-255)"
                        />
                        <p className="text-sm text-zinc-500">
                          Index of the &apos;call&apos; dispatchable
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="contractAddress"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Contract Address
                      </label>
                      <Input
                        id="contractAddress"
                        name="contractAddress"
                        required
                        placeholder="Enter the contract's SS58 address"
                      />
                      <p className="text-sm text-zinc-500">
                        The deployed contract&apos;s account address
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="selector"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Function Selector
                      </label>
                      <Input
                        id="selector"
                        name="selector"
                        required
                        placeholder="0x12345678"
                        pattern="^0x[0-9a-fA-F]{8}$"
                        title="Must be 4 bytes in hex format (e.g., 0x12345678)"
                      />
                      <p className="text-sm text-zinc-500">
                        4-byte selector for the consume_pulse function (e.g., 0x12345678)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="contractValue"
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Value (optional)
                        </label>
                        <Input
                          id="contractValue"
                          name="contractValue"
                          type="text"
                          defaultValue="0"
                          placeholder="0"
                        />
                        <p className="text-sm text-zinc-500">Balance to send (usually 0)</p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="gasLimit"
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          Gas Limit
                        </label>
                        <Input
                          id="gasLimit"
                          name="gasLimit"
                          type="text"
                          required
                          defaultValue="100000000000"
                          placeholder="Enter gas limit"
                        />
                        <p className="text-sm text-zinc-500">Gas allocation for execution</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="storageDepositLimit"
                        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Storage Deposit Limit (optional)
                      </label>
                      <Input
                        id="storageDepositLimit"
                        name="storageDepositLimit"
                        type="text"
                        placeholder="Leave empty for no limit"
                      />
                      <p className="text-sm text-zinc-500">
                        Maximum storage deposit allowed (leave empty for None)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error/Success message moved to bottom */}
              {feedback && (
                <div
                  className={`border-t border-zinc-100 px-6 py-4 dark:border-zinc-800 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
                >
                  <div className="flex items-center">
                    {feedback.type === 'error' && (
                      <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                    )}
                    {feedback.message}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
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
  );
}
