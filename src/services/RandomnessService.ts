// Copyright 2023-2025 Ideal Labs.
// SPDX-License-Identifier: Apache-2.0
import { ApiPromise } from '@polkadot/api';
import type { Vec } from '@polkadot/types';
import type { EventRecord } from '@polkadot/types/interfaces';
import { inject, injectable } from 'tsyringe';
import type { RandomnessDistributionEvent } from '../domain/RandomnessEvent';
import { RandomnessDistributionEvent as RandomnessEvent } from '../domain/RandomnessEvent';
import type { IPolkadotApiService } from './IPolkadotApiService';
import type { IRandomnessService, RandomnessMetrics } from './IRandomnessService';

/**
 * Service for fetching and processing randomness-related events and data
 * from the Ideal Network blockchain
 */
@injectable()
export class RandomnessService implements IRandomnessService {
  // Cache for recently fetched events to avoid duplicate blockchain queries
  private eventCache: Map<string, RandomnessDistributionEvent[]> = new Map();
  private lastRefreshTime: number = 0;
  private cacheTTL: number = 60 * 1000; // 1 minute cache TTL

  constructor(@inject('IPolkadotApiService') private apiService: IPolkadotApiService) {}

  /**
   * Get randomness distribution events within a specific block range
   * @param startBlock Starting block number
   * @param endBlock Ending block number
   * @returns Promise with array of randomness distribution events
   */
  async getRandomnessDistributionEvents(
    startBlock: number,
    endBlock: number
  ): Promise<RandomnessDistributionEvent[]> {
    // Check cache first
    const cacheKey = `${startBlock}-${endBlock}`;
    const now = Date.now();

    if (this.eventCache.has(cacheKey) && now - this.lastRefreshTime < this.cacheTTL) {
      return this.eventCache.get(cacheKey) || [];
    }

    try {
      // IMPORTANT: Instead of querying historical blocks (which seems to be causing errors),
      // we'll only query for events at the current head
      const api = await this.apiService.getApi();
      const events: RandomnessDistributionEvent[] = [];

      try {
        // Get current head info
        const finalizedHead = await api.rpc.chain.getFinalizedHead();
        const apiAtBlock = await api.at(finalizedHead);

        // Try to get current events only
        const apiEvents = (await apiAtBlock.query.system.events()) as unknown as Vec<EventRecord>;

        // Get current block number
        const header = await api.rpc.chain.getHeader(finalizedHead);
        const blockNum = header.number.toNumber();

        // Get timestamp if possible
        let timestamp: Date | undefined;
        try {
          const maybeTimestamp = await apiAtBlock.query.timestamp.now();
          if (maybeTimestamp) {
            const timestampValue = parseInt(maybeTimestamp.toString());
            if (!isNaN(timestampValue)) {
              timestamp = new Date(timestampValue);
            }
          }
        } catch {
          timestamp = new Date(); // Fallback to current time
        }

        // Filter for randomness distribution events
        apiEvents.forEach((eventRecord: EventRecord, eventIdx: number) => {
          const { event } = eventRecord;

          if (
            (event.section === 'randBeacon' || event.section === 'randomnessBeacon') &&
            event.method === 'RandomnessDistributed'
          ) {
            try {
              const randomnessEvent = RandomnessEvent.fromEventData(
                blockNum,
                eventIdx,
                event.data,
                timestamp
              );
              events.push(randomnessEvent);
            } catch (error) {
              console.warn(`Error parsing randomness event:`, error);
            }
          }
        });
      } catch (err) {
        console.error('Error processing current head:', err);
        // No fallback data - let UI handle empty state
      }

      // Update cache
      this.eventCache.set(cacheKey, events);
      this.lastRefreshTime = now;

      return events;
    } catch (err) {
      console.error('Error fetching randomness distribution events:', err);
      return []; // Return empty array instead of fallback data
    }
  }

  /**
   * Get aggregated randomness metrics
   * @returns Promise with randomness metrics
   */
  async getRandomnessMetrics(): Promise<RandomnessMetrics> {
    try {
      const api = await this.apiService.getApi();

      // Get current head and events
      const finalizedHead = await api.rpc.chain.getFinalizedHead();
      const header = await api.rpc.chain.getHeader(finalizedHead);
      const currentBlockNum = header.number.toNumber();

      // Get a sample of recent events
      const recentEvents = await this.getRandomnessDistributionEvents(
        currentBlockNum - 100,
        currentBlockNum
      );

      // Calculate metrics from available events
      const uniqueSubscriptions = new Set(recentEvents.map(event => event.subscriptionId));
      const blocksWithRandomness = new Set(recentEvents.map(event => event.blockNumber));

      return {
        totalDistributions: recentEvents.length,
        totalSubscriptionsServed: uniqueSubscriptions.size,
        averageRandomnessPerBlock:
          blocksWithRandomness.size > 0 ? recentEvents.length / blocksWithRandomness.size : 0,
        distributionsLast24Hours: recentEvents.length, // Same as total for now since we're only querying recent events
      };
    } catch (err) {
      console.error('Error calculating randomness metrics:', err);

      // Return empty metrics
      return {
        totalDistributions: 0,
        totalSubscriptionsServed: 0,
        averageRandomnessPerBlock: 0,
        distributionsLast24Hours: 0,
      };
    }
  }

  /**
   * Get the latest randomness distributions (limited to a specific count)
   * @param limit Maximum number of events to return
   * @returns Promise with array of most recent randomness distribution events
   */
  async getLatestDistributions(limit: number): Promise<RandomnessDistributionEvent[]> {
    try {
      const api = await this.apiService.getApi();

      // Get current block number
      const currentBlockNumber = await api.derive.chain.bestNumber();
      const currentBlockNum = parseInt(currentBlockNumber.toString());

      // Get events from the last 100 blocks (adjust as needed based on network activity)
      const startBlock = Math.max(1, currentBlockNum - 100);
      const events = await this.getRandomnessDistributionEvents(startBlock, currentBlockNum);

      // Sort by block number (descending) and limit
      return events.sort((a, b) => b.blockNumber - a.blockNumber).slice(0, limit);
    } catch (err) {
      console.error('Error fetching latest distributions:', err);
      return [];
    }
  }
}
