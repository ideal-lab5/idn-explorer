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
 * Server-side Redis cache for randomness values.
 * Uses Upstash Redis for persistence across server restarts and serverless instances.
 * Maintains a maximum of 100 entries, removing oldest when limit is reached.
 */

import { getRedis } from './redis';

export interface CachedRandomness {
  block: number;
  randomness: string;
  signature: string;
  startRound: number;
  endRound: number;
  timestamp: number;
}

const CACHE_KEY = 'randomness:cache';
const INITIALIZED_KEY = 'randomness:initialized';
const MAX_CACHE_SIZE = 100;

/**
 * Server-side randomness cache using Redis sorted set.
 * Block number is used as the score for ordering (descending).
 */
class ServerRandomnessCache {
  /**
   * Get all cached randomness entries, sorted by block (newest first)
   */
  async getAll(): Promise<CachedRandomness[]> {
    try {
      // Get all entries from sorted set, ordered by score (block) descending
      const entries = await getRedis().zrange<string[]>(CACHE_KEY, 0, -1, { rev: true });

      if (!entries || entries.length === 0) {
        return [];
      }

      return entries.map(entry => {
        if (typeof entry === 'string') {
          return JSON.parse(entry) as CachedRandomness;
        }
        return entry as unknown as CachedRandomness;
      });
    } catch (error) {
      console.error('[RandomnessCache] Error getting all entries:', error);
      return [];
    }
  }

  /**
   * Add a new randomness entry to the cache.
   * If the cache is full, removes the oldest entry.
   * Prevents duplicates based on block number.
   */
  async add(entry: CachedRandomness): Promise<boolean> {
    try {
      // Check if block already exists
      const exists = await this.has(entry.block);
      if (exists) {
        return false;
      }

      // Add to sorted set with block number as score
      await getRedis().zadd(CACHE_KEY, {
        score: entry.block,
        member: JSON.stringify(entry),
      });

      // Trim to max size (remove oldest entries - lowest scores)
      const currentSize = await getRedis().zcard(CACHE_KEY);
      if (currentSize > MAX_CACHE_SIZE) {
        // Remove entries beyond max size (oldest first)
        await getRedis().zremrangebyrank(CACHE_KEY, 0, currentSize - MAX_CACHE_SIZE - 1);
      }

      return true;
    } catch (error) {
      console.error('[RandomnessCache] Error adding entry:', error);
      return false;
    }
  }

  /**
   * Get the number of cached entries
   */
  async size(): Promise<number> {
    try {
      return await getRedis().zcard(CACHE_KEY);
    } catch (error) {
      console.error('[RandomnessCache] Error getting size:', error);
      return 0;
    }
  }

  /**
   * Check if a block is already cached
   */
  async has(block: number): Promise<boolean> {
    try {
      // Get entries with this exact score (block number)
      const entries = await getRedis().zrange(CACHE_KEY, block, block, { byScore: true });
      return entries.length > 0;
    } catch (error) {
      console.error('[RandomnessCache] Error checking block:', error);
      return false;
    }
  }

  /**
   * Get the latest cached entry
   */
  async getLatest(): Promise<CachedRandomness | null> {
    try {
      const entries = await getRedis().zrange<string[]>(CACHE_KEY, -1, -1);
      if (!entries || entries.length === 0) {
        return null;
      }
      const entry = entries[0];
      if (typeof entry === 'string') {
        return JSON.parse(entry) as CachedRandomness;
      }
      return entry as unknown as CachedRandomness;
    } catch (error) {
      console.error('[RandomnessCache] Error getting latest:', error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  async clear(): Promise<void> {
    try {
      await getRedis().del(CACHE_KEY);
    } catch (error) {
      console.error('[RandomnessCache] Error clearing cache:', error);
    }
  }

  /**
   * Check if the subscription has been initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      const value = await getRedis().get(INITIALIZED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('[RandomnessCache] Error checking initialized:', error);
      return false;
    }
  }

  /**
   * Mark the cache as initialized (subscription is running)
   * Sets a TTL of 60 seconds - if not refreshed, assumes subscription died
   */
  async setInitialized(value: boolean): Promise<void> {
    try {
      if (value) {
        // Set with TTL of 60 seconds - subscription should refresh this periodically
        await getRedis().set(INITIALIZED_KEY, 'true', { ex: 60 });
      } else {
        await getRedis().del(INITIALIZED_KEY);
      }
    } catch (error) {
      console.error('[RandomnessCache] Error setting initialized:', error);
    }
  }

  /**
   * Refresh the initialized flag TTL (call this periodically from subscription)
   */
  async refreshInitialized(): Promise<void> {
    try {
      await getRedis().expire(INITIALIZED_KEY, 60);
    } catch (error) {
      console.error('[RandomnessCache] Error refreshing initialized:', error);
    }
  }
}

// Export singleton instance
export const serverRandomnessCache = new ServerRandomnessCache();
