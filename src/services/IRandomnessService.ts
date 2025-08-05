// Copyright 2023-2024 Ideal Labs.
// SPDX-License-Identifier: Apache-2.0

// Using type import to fix decorator metadata issues
import type { RandomnessDistributionEvent } from '../domain/RandomnessEvent';

export interface RandomnessMetrics {
  totalDistributions: number;
  totalSubscriptionsServed: number;
  averageRandomnessPerBlock: number;
  distributionsLast24Hours: number;
}

export interface IRandomnessService {
  /**
   * Get randomness distribution events within a specific block range
   * @param startBlock Starting block number
   * @param endBlock Ending block number
   * @returns Promise with array of randomness distribution events
   */
  getRandomnessDistributionEvents(
    startBlock: number,
    endBlock: number
  ): Promise<RandomnessDistributionEvent[]>;

  /**
   * Get aggregated randomness metrics
   * @returns Promise with randomness metrics
   */
  getRandomnessMetrics(): Promise<RandomnessMetrics>;

  /**
   * Get the latest randomness distributions (limited to a specific count)
   * @param limit Maximum number of events to return
   * @returns Promise with array of most recent randomness distribution events
   */
  getLatestDistributions(limit: number): Promise<RandomnessDistributionEvent[]>;
}
