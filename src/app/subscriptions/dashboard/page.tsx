"use client"

import { 
  BoltIcon, 
  ClockIcon, 
  CreditCardIcon 
} from "@heroicons/react/24/outline"
import { dummySubscriptions } from "../[id]/data"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Mock data for the chart
const mockData = Array.from({ length: 24 }, (_, i) => ({
  block: `Block ${15240000 + (i * 100)}`,
  value: Math.floor(Math.random() * 100)
}))

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 shadow-sm">
        <p className="text-sm font-medium">{`${label}`}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{`Value: ${payload[0].value}`}</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  // Calculate stats from dummy data
  const activeSubscriptions = dummySubscriptions.filter(sub => sub.status === "active").length
  const totalTokens = dummySubscriptions.reduce((sum, sub) => sum + (sub.duration - sub.remainingAmount), 0)
  const avgDuration = Math.round(dummySubscriptions.reduce((sum, sub) => sum + sub.duration, 0) / dummySubscriptions.length)
  
  return (
    <main className="flex-1 w-full">
      <div className="w-full px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Randomness Delivery Monitor</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Active Subscriptions Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
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
          
          {/* Total Tokens Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Tokens Spent
                </h3>
                <CreditCardIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  +{Math.floor(totalTokens * 0.15).toLocaleString()} from last month
                </p>
              </div>
            </div>
          </div>
          
          {/* Average Duration Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Average Duration
                </h3>
                <ClockIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{avgDuration.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  blocks per subscription
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium">Randomness Delivered</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Randomness values delivered over time
            </p>
          </div>
          <div className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={mockData}
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
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
        <div className="mt-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-medium">Recent Deliveries</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Recent randomness deliveries across all subscriptions
            </p>
          </div>
          <div className="rounded-md">
            <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b border-zinc-200 dark:border-zinc-700">
              <div>Subscription</div>
              <div>Date</div>
              <div>Block</div>
              <div>Tokens</div>
            </div>
            {dummySubscriptions.flatMap(sub => 
              sub.usageHistory.map((usage, idx) => ({
                subscription: sub.name,
                ...usage
              }))
            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((delivery, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-700 last:border-0">
                <div>{delivery.subscription}</div>
                <div>{delivery.date}</div>
                <div>{delivery.blocks}</div>
                <div>{delivery.tokens}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
