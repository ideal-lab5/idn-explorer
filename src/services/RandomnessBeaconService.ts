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
import { randomnessCache } from '@/utils/randomnessCache';
import { inject, injectable } from 'tsyringe';
import type { IPolkadotApiService } from './IPolkadotApiService';
import type {
  AccumulationData,
  IRandomnessBeaconService,
  RandomnessEventCallback,
  Unsubscribe,
} from './IRandomnessBeaconService';

@injectable()
export class RandomnessBeaconService implements IRandomnessBeaconService {
  constructor(@inject('IPolkadotApiService') private polkadotApiService: IPolkadotApiService) {}

  /**
   * Get the latest accumulation data from SparseAccumulation storage
   */
  async getLatestAccumulation(): Promise<AccumulationData | null> {
    try {
      const api = await this.polkadotApiService.getApi();

      // Check both possible pallet names: randBeacon and randomnessBeacon
      const randBeaconQuery = (api?.query as any)?.randBeacon?.sparseAccumulation;
      const randomnessBeaconQuery = (api?.query as any)?.randomnessBeacon?.sparseAccumulation;
      const storageQuery = randBeaconQuery || randomnessBeaconQuery;

      if (!storageQuery) {
        console.warn('SparseAccumulation storage not available');
        return null;
      }

      const accumulation = await storageQuery();

      if (accumulation.isEmpty) {
        return null;
      }

      const data = accumulation.toHuman() as any;

      if (!data) {
        return null;
      }

      // Parse the accumulation data - check various possible field names
      const signature = data.signature || data.asig || data.Signature || data.Asig || '';
      const startRound = this.parseNumber(
        data.start || data.startRound || data.Start || data.StartRound || 0
      );
      const endRound = this.parseNumber(
        data.end || data.endRound || data.End || data.EndRound || 0
      );

      return {
        signature,
        startRound,
        endRound,
      };
    } catch (error) {
      console.error('Error fetching SparseAccumulation:', error);
      return null;
    }
  }

  /**
   * Get the next expected round number
   */
  async getNextRound(): Promise<number> {
    try {
      const api = await this.polkadotApiService.getApi();

      if (!api?.query?.randomnessBeacon?.nextRound) {
        return 0;
      }

      const nextRound = await api.query.randomnessBeacon.nextRound();
      return this.parseNumber(nextRound.toHuman());
    } catch (error) {
      console.error('Error fetching NextRound:', error);
      return 0;
    }
  }

  /**
   * Subscribe to SignatureVerificationSuccess events
   */
  async subscribeToRandomnessEvents(callback: RandomnessEventCallback): Promise<Unsubscribe> {
    const api = await this.polkadotApiService.getApi();

    if (!api?.query?.system?.events) {
      console.warn('Events subscription not available');
      return () => {};
    }

    // Subscribe to new blocks and check for our event
    const unsubscribe = (await api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        const section = event.section?.toLowerCase() || '';
        const method = event.method || '';

        // Check if this is the SignatureVerificationSuccess event from randBeacon
        if (
          (section === 'randbeacon' || section.includes('randomness')) &&
          method === 'SignatureVerificationSuccess'
        ) {
          // Fetch the latest accumulation and create a Randomness entry
          this.handleRandomnessEvent(callback);
        }
      });
    })) as unknown as () => void;

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  /**
   * Handle a randomness event by fetching current data and invoking callback
   */
  private async handleRandomnessEvent(callback: RandomnessEventCallback): Promise<void> {
    try {
      const api = await this.polkadotApiService.getApi();
      const header = await api.rpc.chain.getHeader();
      const currentBlock = header.number.toNumber();

      const accumulation = await this.getLatestAccumulation();

      if (!accumulation) {
        console.warn('No accumulation data available after event');
        return;
      }

      const randomness = new Randomness(
        currentBlock,
        accumulation.signature,
        accumulation.signature,
        accumulation.startRound,
        accumulation.endRound,
        Date.now()
      );

      // Cache the new entry
      randomnessCache.add(randomness);

      // Invoke the callback
      callback(randomness);
    } catch (error) {
      console.error('Error handling randomness event:', error);
    }
  }

  /**
   * Get cached randomness values from localStorage
   */
  getCachedRandomness(): Randomness[] {
    return randomnessCache.getAll();
  }

  /**
   * Clear the randomness cache
   */
  clearCache(): void {
    randomnessCache.clear();
  }

  /**
   * Parse a number from various formats (handles comma-separated numbers)
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return parseInt(value.replace(/,/g, ''), 10) || 0;
    }
    return 0;
  }
}
