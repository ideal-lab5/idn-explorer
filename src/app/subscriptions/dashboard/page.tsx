'use client';

import { useDashboard } from '@/components/contexts/dashboardContext';
import { useSubscription } from '@/components/contexts/subscriptionContext';
import { domainToUiSubscription } from '@/utils/subscriptionMapper';
import { BoltIcon, ClockIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
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

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">Block {label}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Distributions: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  // Use the dashboard context for real blockchain data
  const { dashboardData, refreshData } = useDashboard();
  const loading = dashboardData.isLoading;

  // Client-side only states to prevent hydration mismatches
  const [showError, setShowError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mark when component has mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle error state more gracefully with client-side only rendering
  useEffect(() => {
    // Only show errors if they persist after initial load
    if (dashboardData.isError && dashboardData.errorMessage && isClient) {
      // Delayed error display to prevent React hydration errors
      const timer = setTimeout(() => {
        setShowError(true);
        setErrorMessage(dashboardData.errorMessage);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
      setErrorMessage(null);
    }
  }, [dashboardData.isError, dashboardData.errorMessage, isClient]);

  // Format distribution events for the chart
  const chartData = useMemo(() => {
    if (!dashboardData?.distributionEvents || dashboardData.distributionEvents.length === 0) {
      return [];
    }

    // Sort events by block number
    const sortedEvents = [...dashboardData.distributionEvents].sort(
      (a, b) => a.blockNumber - b.blockNumber
    );

    // Group events by block number for the chart
    const groupedByBlock = sortedEvents.reduce((acc: any, event) => {
      const block = event.blockNumber;
      if (!acc[block]) {
        acc[block] = { block: `${block}`, count: 0 };
      }
      acc[block].count += 1;
      return acc;
    }, {});

    // Convert to array and limit to most recent 50 blocks with activity
    return Object.values(groupedByBlock)
      .sort((a: any, b: any) => parseInt(b.block) - parseInt(a.block))
      .slice(0, 50)
      .reverse();
  }, [dashboardData?.distributionEvents]);

  // Calculate stats from real data
  const activeSubscriptions = dashboardData?.activeSubscriptions?.length || 0;
  const totalDistributions = dashboardData?.randomnessMetrics?.totalDistributions || 0;
  const uniqueSubscriptions = dashboardData?.randomnessMetrics?.totalSubscriptionsServed || 0;

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
                  Currently active randomness subscriptions
                </p>
              </div>
            </div>
          </div>

          {/* Total Distributions Card */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Distributions
                </h3>
                <CreditCardIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{totalDistributions}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Total randomness distributions delivered
                </p>
              </div>
            </div>
          </div>

          {/* Unique Subscriptions Served Card */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Unique Subscriptions Served
                </h3>
                <ClockIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{uniqueSubscriptions}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Distinct subscriptions receiving randomness
                </p>
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
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                  interval={chartData.length > 20 ? Math.ceil(chartData.length / 10) : 0}
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
                  dataKey="count"
                  name="Distributions"
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
            <h3 className="text-lg font-medium">Latest Randomness Distributions</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Most recent randomness values delivered to subscriptions
            </p>
          </div>
          <div className="rounded-md">
            <div className="grid grid-cols-4 gap-4 border-b border-zinc-200 p-4 font-medium dark:border-zinc-700">
              <div>Subscription ID</div>
              <div>Block</div>
              <div>Target</div>
              <div className="hidden md:block">Random Value</div>
            </div>
            {loading ? (
              <div className="grid grid-cols-4 gap-4 border-b border-zinc-200 p-4 dark:border-zinc-700">
                <div className="h-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="h-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="h-6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="hidden h-6 animate-pulse rounded bg-zinc-200 md:block dark:bg-zinc-700"></div>
              </div>
            ) : showError && errorMessage ? (
              <div className="p-4 text-red-500">Error connecting to blockchain: {errorMessage}</div>
            ) : dashboardData?.latestDistributions &&
              dashboardData.latestDistributions.length > 0 ? (
              dashboardData.latestDistributions.map((event, index) => (
                <div
                  key={event.id}
                  className="grid grid-cols-4 gap-4 border-b border-zinc-200 p-4 last:border-0 dark:border-zinc-700"
                >
                  <div className="truncate" title={event.subscriptionId}>
                    {event.subscriptionId.substring(0, 10)}...
                  </div>
                  <div>{event.blockNumber}</div>
                  <div className="truncate" title={JSON.stringify(event.target)}>
                    {event.target && typeof event.target === 'object'
                      ? 'Parachain Target'
                      : 'Unknown'}
                  </div>
                  <div className="hidden truncate md:block" title={event.randomValue}>
                    {event.randomValue.substring(0, 10)}...
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-zinc-500">No randomness distributions found</div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800">
            {showError ? (
              <div className="text-sm text-amber-600">
                <span className="mr-2 inline-block">⚠️</span>
                Connection issues detected. Data may be limited.
              </div>
            ) : (
              <div className="text-sm italic text-zinc-500">
                {!loading &&
                  dashboardData.latestDistributions?.length === 0 &&
                  'No randomness distributions found yet. This is normal for a new network.'}
                {!loading &&
                  dashboardData.activeSubscriptions?.length === 0 &&
                  'No active subscriptions found.'}
              </div>
            )}
            <button
              onClick={() => refreshData()}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
