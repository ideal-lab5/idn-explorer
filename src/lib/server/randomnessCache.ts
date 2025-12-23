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

const CACHE_KEY = 'randomness:cache'; // Sorted set for ordering
const CACHE_DATA_KEY = 'randomness:data'; // Hash for actual entry data
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
      const redis = getRedis();

      // Get all member keys from sorted set, ordered by score (block) descending
      const memberKeys = await redis.zrange<string[]>(CACHE_KEY, 0, -1, { rev: true });

      if (!memberKeys || memberKeys.length === 0) {
        return [];
      }

      // Fetch all entry data from hash
      const entries: CachedRandomness[] = [];
      for (const key of memberKeys) {
        const data = await redis.hget(CACHE_DATA_KEY, key);
        if (data) {
          if (typeof data === 'string') {
            entries.push(JSON.parse(data) as CachedRandomness);
          } else {
            entries.push(data as unknown as CachedRandomness);
          }
        }
      }

      return entries;
    } catch (error) {
      console.error('[RandomnessCache] Error getting all entries:', error);
      return [];
    }
  }

  /**
   * Add a new randomness entry to the cache.
   * If the cache is full, removes the oldest entry.
   * Prevents duplicates based on block number using a separate hash for member IDs.
   */
  async add(entry: CachedRandomness): Promise<boolean> {
    try {
      const redis = getRedis();

      // Use block number as the member key to ensure uniqueness
      // This way, even if called multiple times for the same block, it overwrites
      const memberKey = `block:${entry.block}`;

      // Check if this block already exists using the hash
      const existingEntry = await redis.hget(CACHE_DATA_KEY, memberKey);
      if (existingEntry) {
        return false;
      }

      // Store the entry data in a hash (keyed by block)
      await redis.hset(CACHE_DATA_KEY, { [memberKey]: JSON.stringify(entry) });

      // Add to sorted set with block number as score (for ordering)
      // Use the memberKey as the member to ensure uniqueness
      await redis.zadd(CACHE_KEY, {
        score: entry.block,
        member: memberKey,
      });

      // Trim to max size (remove oldest entries - lowest scores)
      const currentSize = await redis.zcard(CACHE_KEY);
      if (currentSize > MAX_CACHE_SIZE) {
        // Get the oldest entries to remove
        const toRemove = await redis.zrange<string[]>(
          CACHE_KEY,
          0,
          currentSize - MAX_CACHE_SIZE - 1
        );
        if (toRemove.length > 0) {
          // Remove from sorted set
          await redis.zremrangebyrank(CACHE_KEY, 0, currentSize - MAX_CACHE_SIZE - 1);
          // Remove from hash
          await redis.hdel(CACHE_DATA_KEY, ...toRemove);
        }
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
      const memberKey = `block:${block}`;
      const exists = await getRedis().hexists(CACHE_DATA_KEY, memberKey);
      return exists === 1;
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
      const redis = getRedis();

      // Get the member key with highest score (most recent block)
      const memberKeys = await redis.zrange<string[]>(CACHE_KEY, -1, -1);
      if (!memberKeys || memberKeys.length === 0) {
        return null;
      }

      const memberKey = memberKeys[0];
      const data = await redis.hget(CACHE_DATA_KEY, memberKey);

      if (!data) {
        return null;
      }

      if (typeof data === 'string') {
        return JSON.parse(data) as CachedRandomness;
      }
      return data as unknown as CachedRandomness;
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
      const redis = getRedis();
      await redis.del(CACHE_KEY);
      await redis.del(CACHE_DATA_KEY);
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
