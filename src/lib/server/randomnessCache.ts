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
 * Server-side in-memory cache for randomness values.
 * Maintains a maximum of 100 entries, removing oldest when limit is reached.
 */

export interface CachedRandomness {
  block: number;
  randomness: string;
  signature: string;
  startRound: number;
  endRound: number;
  timestamp: number;
}

const MAX_CACHE_SIZE = 100;

class ServerRandomnessCache {
  private cache: CachedRandomness[] = [];
  private initialized = false;

  /**
   * Get all cached randomness entries, sorted by block (newest first)
   */
  getAll(): CachedRandomness[] {
    return [...this.cache];
  }

  /**
   * Add a new randomness entry to the cache.
   * If the cache is full, removes the oldest entry.
   * Prevents duplicates based on block number.
   */
  add(entry: CachedRandomness): boolean {
    // Check for duplicates
    if (this.cache.some(r => r.block === entry.block)) {
      return false;
    }

    // Add at the beginning (newest first)
    this.cache.unshift(entry);

    // Trim to max size (remove oldest)
    if (this.cache.length > MAX_CACHE_SIZE) {
      this.cache = this.cache.slice(0, MAX_CACHE_SIZE);
    }

    return true;
  }

  /**
   * Get the number of cached entries
   */
  size(): number {
    return this.cache.length;
  }

  /**
   * Check if a block is already cached
   */
  has(block: number): boolean {
    return this.cache.some(r => r.block === block);
  }

  /**
   * Get the latest cached entry
   */
  getLatest(): CachedRandomness | null {
    return this.cache.length > 0 ? this.cache[0] : null;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache = [];
  }

  /**
   * Check if the subscription has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Mark the cache as initialized (subscription is running)
   */
  setInitialized(value: boolean): void {
    this.initialized = value;
  }
}

// Singleton instance - survives across API calls in the same server process
export const serverRandomnessCache = new ServerRandomnessCache();
