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

import { Randomness } from '@/domain/Randomness';

/**
 * Accumulation data from the randomness-beacon pallet's SparseAccumulation storage
 */
export interface AccumulationData {
  /** The aggregated BLS signature (randomness value) */
  signature: string;
  /** First round number in the aggregation */
  startRound: number;
  /** Last round number in the aggregation */
  endRound: number;
}

/**
 * Callback for randomness event subscription
 */
export type RandomnessEventCallback = (randomness: Randomness) => void;

/**
 * Unsubscribe function returned by event subscription
 */
export type Unsubscribe = () => void;

/**
 * Service interface for interacting with the randomness-beacon pallet
 */
export interface IRandomnessBeaconService {
  /**
   * Get the latest accumulation data from SparseAccumulation storage
   * @returns The current accumulation data or null if not available
   */
  getLatestAccumulation(): Promise<AccumulationData | null>;

  /**
   * Get the next expected round number
   * @returns The next round number
   */
  getNextRound(): Promise<number>;

  /**
   * Subscribe to SignatureVerificationSuccess events
   * When an event is detected, reads SparseAccumulation and invokes the callback
   * @param callback Function to call when new randomness is ingested
   * @returns Unsubscribe function to stop listening
   */
  subscribeToRandomnessEvents(callback: RandomnessEventCallback): Promise<Unsubscribe>;

  /**
   * Get cached randomness values from localStorage
   * @returns Array of cached randomness values
   */
  getCachedRandomness(): Randomness[];

  /**
   * Clear the randomness cache
   */
  clearCache(): void;
}
