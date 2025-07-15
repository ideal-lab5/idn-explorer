'use client';

import { useSubscription } from '@/components/contexts/subscriptionContext';
import { domainToUiSubscription } from '@/utils/subscriptionMapper';
import { useEffect, useState } from 'react';
import { UiSubscription } from '../types/UiSubscription';
import { SubscriptionDetails } from './subscription-details';

// This would be used for static site generation, but we're using dynamic data now
// export function generateStaticParams() {
//   return [];
// }

// This is now a client component due to the context usage
export default function Page({ params }: { params: { id: string } }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscription, setSubscription] = useState<UiSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getSubscription } = useSubscription();

  useEffect(() => {
    async function loadSubscription() {
      try {
        const domainSubscription = await getSubscription(params.id);
        const uiSubscription = domainToUiSubscription(domainSubscription);
        setSubscription(uiSubscription);
      } catch (err) {
        console.error('Failed to load subscription:', err);
        setError('Failed to load subscription details');
      } finally {
        setInitialLoading(false);
      }
    }

    loadSubscription();
  }, [params.id, getSubscription]);

  return (
    <main className="w-full flex-1">
      <div className="w-full px-8 py-8">
        {initialLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"></div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : subscription ? (
          <SubscriptionDetails id={params.id} subscription={subscription} />
        ) : null}
      </div>
    </main>
  );
}
