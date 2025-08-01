'use client';

import { Button } from '@/components/button';
import { useConnectedWallet } from '@/components/contexts/connectedWalletContext';
import { useSubscription } from '@/components/contexts/subscriptionContext';
import { ConnectWallet } from '@/components/idn/connectWallet';
import XcmLocationViewer from '@/components/xcm/XcmLocationViewer';
import { domainToUiSubscription } from '@/utils/subscriptionMapper';
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UiSubscription } from '../types/UiSubscription';

interface SubscriptionDetailsProps {
  id: string;
  subscription: UiSubscription;
}

export function SubscriptionDetails({ id, subscription: initialData }: SubscriptionDetailsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UiSubscription>(initialData);
  const [feedback, setFeedback] = useState<{
    message: string;
    visible: boolean;
    type: 'success' | 'error';
  } | null>(null);
  const router = useRouter();
  const { signer, isConnected } = useConnectedWallet();
  const { getSubscription, pauseSubscription, reactivateSubscription, killSubscription } =
    useSubscription();

  // Fetch the latest subscription data from the service
  useEffect(() => {
    async function fetchSubscription() {
      if (!isConnected) return;

      try {
        setIsLoading(true);
        setError(null);
        const domainSubscription = await getSubscription(id);
        const uiSubscription = domainToUiSubscription(domainSubscription);
        setSubscription(uiSubscription);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        setError('Failed to load subscription details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, [id, isConnected, getSubscription]);

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    try {
      setIsLoading(true);
      setFeedback(null);

      if (action === 'cancel') {
        // Set specific cancelling state for the dialog
        setIsCancelling(true);
      }

      if (action === 'pause') {
        await pauseSubscription(signer, id);
        setFeedback({
          message: 'Subscription paused successfully',
          visible: true,
          type: 'success',
        });
      } else if (action === 'resume') {
        await reactivateSubscription(signer, id);
        setFeedback({
          message: 'Subscription resumed successfully',
          visible: true,
          type: 'success',
        });
      } else if (action === 'cancel') {
        await killSubscription(signer, id);
        setFeedback({
          message: 'Subscription cancelled successfully',
          visible: true,
          type: 'success',
        });
        setTimeout(() => {
          router.push('/subscriptions');
        }, 1500);
        return;
      }

      // Refresh the subscription data
      const domainSubscription = await getSubscription(id);
      const uiSubscription = domainToUiSubscription(domainSubscription);
      setSubscription(uiSubscription);

      // Auto-hide feedback after 3 seconds
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } catch (err) {
      console.error(`Failed to ${action} subscription:`, err);
      setFeedback({
        message: `Failed to ${action} subscription: ${err instanceof Error ? err.message : 'Unknown error'}`,
        visible: true,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      if (action === 'cancel') {
        setIsCancelling(false);
        setIsDialogOpen(false);
      }
    }
  };

  if (!signer || !isConnected) {
    return (
      <div>
        <div className="mb-6 flex items-center">
          <Link href="/subscriptions" className="mr-4">
            <Button className="rounded-full p-2">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{subscription.name}</h1>
            <p className="text-zinc-500">
              Parachain {subscription.parachainId} • ID: {id}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold">
            Please connect your wallet to manage this subscription
          </h2>
          <ConnectWallet buttonOnly={true} />
        </div>
      </div>
    );
  }

  if (isLoading && !subscription) {
    return (
      <div>
        <div className="mb-6 flex items-center">
          <Link href="/subscriptions" className="mr-4">
            <Button className="rounded-full p-2">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading Subscription...</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6 flex items-center">
          <Link href="/subscriptions" className="mr-4">
            <Button className="rounded-full p-2">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link href="/subscriptions" className="mr-4">
          <Button className="rounded-full p-2">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{subscription.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <p className="break-all font-mono text-sm text-zinc-400">ID: {id}</p>
            <DocumentDuplicateIcon
              className="h-4 w-4 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Copy subscription ID"
              onClick={() => {
                navigator.clipboard.writeText(id);
                setFeedback({
                  message: 'Subscription ID copied to clipboard!',
                  visible: true,
                  type: 'success',
                });
                setTimeout(() => setFeedback(null), 3000);
              }}
            />
          </div>
        </div>
      </div>

      {feedback && feedback.visible && (
        <div
          className={`mb-4 rounded-lg p-4 ${feedback.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
          <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Subscription Status</h2>
            <p className="text-sm text-zinc-500">Current status and details of your subscription</p>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Status</p>
                <p
                  className={`font-medium ${
                    subscription.status === 'active'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : subscription.status === 'paused'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-500">Total Credits</p>
                <p className="font-medium">{subscription.totalCredits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Credits Remaining</p>
                <p className="font-medium">{subscription.creditsRemaining.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Credits Consumed</p>
                <p className="font-medium">{subscription.creditsConsumed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Frequency</p>
                <p className="font-medium">
                  Every {subscription.frequency.toLocaleString()} blocks
                </p>
              </div>
              <div className="col-span-2">
                <p className="mb-3 text-sm text-zinc-500">XCM Location</p>
                <XcmLocationViewer
                  location={subscription.rawTarget || subscription.xcmLocation}
                  showRaw={true}
                />
              </div>
              {subscription.callIndex && (
                <div>
                  <p className="text-sm text-zinc-500">Call Index</p>
                  <p className="font-medium">
                    Pallet {subscription.callIndex.pallet}, Call {subscription.callIndex.call}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            {subscription.status === 'active' ? (
              <Button onClick={() => handleAction('pause')} disabled={isLoading}>
                {isLoading ? (
                  'Processing...'
                ) : (
                  <>
                    <PauseIcon className="mr-2 h-4 w-4" /> Pause Subscription
                  </>
                )}
              </Button>
            ) : subscription.status === 'paused' ? (
              <Button onClick={() => handleAction('resume')} disabled={isLoading}>
                {isLoading ? (
                  'Processing...'
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" /> Resume Subscription
                  </>
                )}
              </Button>
            ) : null}

            <Button onClick={() => setIsDialogOpen(true)} disabled={isLoading}>
              <XMarkIcon className="mr-2 h-4 w-4" /> Cancel Subscription
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Delivery History</h2>
            <p className="text-sm text-zinc-500">Recent activity for this subscription</p>
          </div>
          <div className="px-6 py-5">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-200 p-4 font-medium dark:border-zinc-700">
                <div>Block</div>
                <div>Credits Used</div>
              </div>
              {subscription.usageHistory.map((usage, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-4 border-b border-zinc-200 p-4 last:border-0 dark:border-zinc-700"
                >
                  <div>{usage.blocks}</div>
                  <div>{usage.credits}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-zinc-800">
            <div className="p-6">
              <div className="mb-4 flex items-center">
                <ExclamationTriangleIcon className="mr-2 h-6 w-6 text-amber-500" />
                <h3 className="text-lg font-semibold">Cancel Subscription</h3>
              </div>
              <p className="mb-4">
                Are you sure you want to cancel this subscription? This action cannot be undone, and
                any remaining credits will be refunded.
              </p>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsDialogOpen(false)} disabled={isCancelling}>
                  Keep Subscription
                </Button>
                <Button onClick={() => handleAction('cancel')} disabled={isCancelling}>
                  {isCancelling ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="mr-2 h-4 w-4" />
                      Cancel Subscription
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
