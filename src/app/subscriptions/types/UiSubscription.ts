/*
 * Copyright 2025 by Ideal Labs, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Subscription type - determines how randomness is delivered
 */
export type SubscriptionType = 'runtime' | 'contract';

/**
 * UI representation of a subscription
 * This interface is used for UI display purposes only and is separate from the domain model
 */
export interface UiSubscription {
  id: string;
  name: string;
  parachainId: number;
  totalCredits: number; // Total credits purchased
  creditsRemaining: number; // Credits remaining
  creditsConsumed: number; // Credits already consumed
  frequency: number;
  xcmLocation: string;
  rawTarget?: any; // Raw XCM location data for sophisticated viewing
  status: string;

  // Subscription type (runtime extrinsic or smart contract)
  subscriptionType: SubscriptionType;

  // Runtime call data (always present)
  callIndex: { pallet: number; call: number };

  // Contract-specific fields (only present for contract subscriptions)
  contractAddress?: string;
  contractSelector?: string;
  gasLimit?: string;
  storageDepositLimit?: string | null;
  contractValue?: string;

  // Usage history
  usageHistory: Array<{
    blocks: number;
    credits: number;
  }>;
}
