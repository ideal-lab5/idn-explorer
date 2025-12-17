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
 * Server-side singleton that subscribes to randomness beacon events
 * and populates the server-side cache.
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { CachedRandomness, serverRandomnessCache } from './randomnessCache';

class RandomnessSubscriptionManager {
  private api: ApiPromise | null = null;
  private unsubscribe: (() => void) | null = null;
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize the subscription to the chain
   */
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || serverRandomnessCache.isInitialized()) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_NODE_WS || 'ws://127.0.0.1:9944';
      console.log('[RandomnessSubscription] Connecting to:', wsUrl);

      const provider = new WsProvider(wsUrl);
      this.api = await ApiPromise.create({ provider });

      await this.api.isReady;
      console.log('[RandomnessSubscription] Connected to chain');

      // Set up event subscription
      await this.subscribeToEvents();

      serverRandomnessCache.setInitialized(true);
      console.log('[RandomnessSubscription] Subscription initialized');

      // Handle disconnection
      provider.on('disconnected', () => {
        console.log('[RandomnessSubscription] Disconnected from chain');
        this.handleDisconnect();
      });
    } catch (error) {
      console.error('[RandomnessSubscription] Failed to initialize:', error);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Subscribe to system events and filter for SignatureVerificationSuccess
   */
  private async subscribeToEvents(): Promise<void> {
    if (!this.api) return;

    this.unsubscribe = (await this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        const section = event.section?.toLowerCase() || '';
        const method = event.method || '';

        // Check if this is the SignatureVerificationSuccess event from randBeacon
        if (
          (section === 'randbeacon' || section.includes('randomness')) &&
          method === 'SignatureVerificationSuccess'
        ) {
          this.handleRandomnessEvent();
        }
      });
    })) as unknown as () => void;
  }

  /**
   * Handle a randomness event by fetching accumulation data
   */
  private async handleRandomnessEvent(): Promise<void> {
    if (!this.api) return;

    try {
      const header = await this.api.rpc.chain.getHeader();
      const currentBlock = header.number.toNumber();

      // Skip if we already have this block
      if (serverRandomnessCache.has(currentBlock)) {
        return;
      }

      const accumulation = await this.getLatestAccumulation();

      if (!accumulation) {
        return;
      }

      const entry: CachedRandomness = {
        block: currentBlock,
        randomness: accumulation.signature,
        signature: accumulation.signature,
        startRound: accumulation.startRound,
        endRound: accumulation.endRound,
        timestamp: Date.now(),
      };

      const added = serverRandomnessCache.add(entry);
      if (added) {
        console.log(
          `[RandomnessSubscription] Added randomness for block ${currentBlock}, cache size: ${serverRandomnessCache.size()}`
        );
      }
    } catch (error) {
      console.error('[RandomnessSubscription] Error handling event:', error);
    }
  }

  /**
   * Get the latest accumulation data from storage
   */
  private async getLatestAccumulation(): Promise<{
    signature: string;
    startRound: number;
    endRound: number;
  } | null> {
    if (!this.api) return null;

    try {
      // Check both possible pallet names
      const randBeaconQuery = (this.api.query as any)?.randBeacon?.sparseAccumulation;
      const randomnessBeaconQuery = (this.api.query as any)?.randomnessBeacon?.sparseAccumulation;
      const storageQuery = randBeaconQuery || randomnessBeaconQuery;

      if (!storageQuery) {
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

      const signature = data.signature || data.asig || data.Signature || data.Asig || '';
      const startRound = this.parseNumber(
        data.start || data.startRound || data.Start || data.StartRound || 0
      );
      const endRound = this.parseNumber(
        data.end || data.endRound || data.End || data.EndRound || 0
      );

      return { signature, startRound, endRound };
    } catch (error) {
      console.error('[RandomnessSubscription] Error fetching accumulation:', error);
      return null;
    }
  }

  /**
   * Parse number from various formats
   */
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseInt(value.replace(/,/g, ''), 10) || 0;
    return 0;
  }

  /**
   * Handle disconnection - clean up and schedule reconnect
   */
  private handleDisconnect(): void {
    serverRandomnessCache.setInitialized(false);

    if (this.unsubscribe) {
      try {
        this.unsubscribe();
      } catch {
        // Ignore errors during cleanup
      }
      this.unsubscribe = null;
    }

    this.api = null;
    this.scheduleReconnect();
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    console.log('[RandomnessSubscription] Scheduling reconnect in 5 seconds...');
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.initialize();
    }, 5000);
  }

  /**
   * Clean up resources
   */
  async shutdown(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }

    serverRandomnessCache.setInitialized(false);
  }
}

// Singleton instance
export const randomnessSubscriptionManager = new RandomnessSubscriptionManager();
