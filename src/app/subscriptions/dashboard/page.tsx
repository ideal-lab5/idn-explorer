'use client';

import { useSubscription } from '@/components/contexts/subscriptionContext';
import { domainToUiSubscription } from '@/utils/subscriptionMapper';
import { BoltIcon, ClockIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { UiSubscription } from '../types/UiSubscription';

// Mock data for the chart
const mockData = Array.from({ length: 24 }, (_, i) => ({
  block: `Block ${15240000 + i * 100}`,
  value: Math.floor(Math.random() * 100),
}));

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">{`${label}`}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{`Value: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  // Use the subscription context to get data for all subscriptions
  const { getAllSubscriptions } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uiSubscriptions, setUiSubscriptions] = useState<UiSubscription[]>([]);

  // Fetch all subscriptions on component mount
  useEffect(() => {
    const fetchAllSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all subscriptions for the dashboard
        const allSubscriptions = await getAllSubscriptions();

        // Convert domain subscriptions to UI model
        const convertedSubscriptions = allSubscriptions.map(sub => {
          const uiSub = domainToUiSubscription(sub);
          // Ensure all fields required by our interface exist
          return {
            ...uiSub,
            // Add default values for any potentially missing fields
            usageHistory: uiSub.usageHistory || [],
          } as UiSubscription;
        });

        setUiSubscriptions(convertedSubscriptions);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err?.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllSubscriptions();
  }, [getAllSubscriptions]);

  // Calculate stats from real data
  const activeSubscriptions = uiSubscriptions.filter(
    (sub: UiSubscription) => sub.status === 'active'
  ).length;
  const totalCreditsUsed = uiSubscriptions.reduce(
    (sum: number, sub: UiSubscription) => sum + sub.creditsConsumed,
    0
  );
  const avgTotalCredits =
    uiSubscriptions.length > 0
      ? Math.round(
          uiSubscriptions.reduce((sum: number, sub: UiSubscription) => sum + sub.totalCredits, 0) /
            uiSubscriptions.length
        )
      : 0;

  return (
    <main className="w-full flex-1">
      <div className="w-full px-8 py-8">
        <h1 className="mb-6 text-3xl font-bold">Randomness Delivery Monitor</h1>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Active Subscriptions Card */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Active Subscriptions
                </h3>
                <BoltIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{activeSubscriptions}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {activeSubscriptions > 1 ? '+1 from last month' : 'No change from last month'}
                </p>
              </div>
            </div>
          </div>

          {/* Total Credits Used Card */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Credits Used
                </h3>
                <CreditCardIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{totalCreditsUsed.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  +{Math.floor(totalCreditsUsed * 0.15).toLocaleString()} from last month
                </p>
              </div>
            </div>
          </div>

          {/* Average Credits Card */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Average Total Credits
                </h3>
                <ClockIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{avgTotalCredits.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">credits per subscription</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="text-lg font-medium">Randomness Delivered</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Randomness values delivered over time
            </p>
          </div>
          <div className="h-[400px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="block"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor' }}
                  axisLine={{ stroke: 'currentColor' }}
                  height={60}
                  scale="auto"
                  padding={{ left: 0, right: 0 }}
                  allowDuplicatedCategory={false}
                  orientation="bottom"
                  tickMargin={8}
                  minTickGap={5}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickLine={{ stroke: 'currentColor' }}
                  axisLine={{ stroke: 'currentColor' }}
                  width={60}
                  scale="auto"
                  padding={{ top: 0, bottom: 0 }}
                  allowDecimals={false}
                  orientation="left"
                  tickMargin={8}
                  domain={[0, 'auto']}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'currentColor' }}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Deliveries Table */}
        <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="text-lg font-medium">Recent Deliveries</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Recent randomness deliveries across all subscriptions
            </p>
          </div>
          <div className="rounded-md">
            <div className="grid grid-cols-3 gap-4 border-b border-zinc-200 p-4 font-medium dark:border-zinc-700">
              <div>Subscription</div>
              <div>Block</div>
              <div>Credits</div>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-200 p-4 dark:border-zinc-700">
                <div className="h-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="h-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="h-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-500">Error loading subscription data</div>
            ) : (
              uiSubscriptions
                .flatMap((sub: UiSubscription) =>
                  sub.usageHistory.map((usage: { blocks: number; credits: number }) => ({
                    subscription: sub.name,
                    ...usage,
                  }))
                )
                .slice(0, 5)
                .map(
                  (
                    delivery: { subscription: string; blocks: number; credits: number },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="grid grid-cols-3 gap-4 border-b border-zinc-200 p-4 last:border-0 dark:border-zinc-700"
                    >
                      <div>{delivery.subscription}</div>
                      <div>{delivery.blocks}</div>
                      <div>{delivery.credits}</div>
                    </div>
                  )
                )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
