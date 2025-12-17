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

const CACHE_KEY = 'idn-randomness-cache';
const MAX_CACHE_SIZE = 100;

/**
 * Utility for caching randomness values in browser localStorage
 */
export const randomnessCache = {
  /**
   * Get all cached randomness entries
   * @returns Array of Randomness objects, sorted by block (newest first)
   */
  getAll(): Randomness[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        return [];
      }

      const data = JSON.parse(cached);
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: any) => Randomness.fromCache(item)).sort((a, b) => b.block - a.block);
    } catch (error) {
      console.error('Error reading randomness cache:', error);
      return [];
    }
  },

  /**
   * Add a new randomness entry to the cache
   * Prevents duplicates based on block number
   * @param randomness The randomness entry to cache
   */
  add(randomness: Randomness): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const existing = this.getAll();

      // Check if this block is already cached
      if (existing.some(r => r.block === randomness.block)) {
        return;
      }

      // Add new entry
      existing.unshift(randomness);

      // Trim to max size
      const trimmed = existing.slice(0, MAX_CACHE_SIZE);

      // Save to localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed.map(r => r.toCache())));
    } catch (error) {
      console.error('Error saving to randomness cache:', error);
    }
  },

  /**
   * Add multiple randomness entries to the cache
   * @param entries Array of randomness entries to cache
   */
  addAll(entries: Randomness[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const existing = this.getAll();
      const existingBlocks = new Set(existing.map(r => r.block));

      // Filter out duplicates
      const newEntries = entries.filter(r => !existingBlocks.has(r.block));

      if (newEntries.length === 0) {
        return;
      }

      // Merge and sort
      const merged = [...newEntries, ...existing].sort((a, b) => b.block - a.block);

      // Trim to max size
      const trimmed = merged.slice(0, MAX_CACHE_SIZE);

      // Save to localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed.map(r => r.toCache())));
    } catch (error) {
      console.error('Error saving to randomness cache:', error);
    }
  },

  /**
   * Clear the entire cache
   */
  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing randomness cache:', error);
    }
  },

  /**
   * Get the number of cached entries
   * @returns Number of cached entries
   */
  size(): number {
    return this.getAll().length;
  },

  /**
   * Check if a block is already cached
   * @param block Block number to check
   * @returns True if the block is cached
   */
  has(block: number): boolean {
    return this.getAll().some(r => r.block === block);
  },
};
