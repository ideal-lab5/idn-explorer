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

import { MockRedis } from '../mocks/MockRedis';

// Mock the redis module before importing the cache
const mockRedis = new MockRedis();
jest.mock('@/lib/server/redis', () => ({
  getRedis: () => mockRedis,
}));

// Import after mocking
import { serverRandomnessCache, CachedRandomness } from '@/lib/server/randomnessCache';

describe('ServerRandomnessCache', () => {
  beforeEach(() => {
    mockRedis.clear();
  });

  const createEntry = (block: number): CachedRandomness => ({
    block,
    randomness: `0x${block.toString(16)}`,
    signature: `0xsig${block}`,
    startRound: block * 100,
    endRound: block * 100 + 10,
    timestamp: Date.now(),
  });

  describe('add', () => {
    it('should add a new entry', async () => {
      const entry = createEntry(100);

      const result = await serverRandomnessCache.add(entry);

      expect(result).toBe(true);
      const size = await serverRandomnessCache.size();
      expect(size).toBe(1);
    });

    it('should not add duplicate entries for the same block', async () => {
      const entry1 = createEntry(100);
      const entry2 = createEntry(100);
      entry2.timestamp = Date.now() + 1000; // Different timestamp

      await serverRandomnessCache.add(entry1);
      const result = await serverRandomnessCache.add(entry2);

      expect(result).toBe(false);
      const size = await serverRandomnessCache.size();
      expect(size).toBe(1);
    });

    it('should allow different blocks', async () => {
      const entry1 = createEntry(100);
      const entry2 = createEntry(101);

      await serverRandomnessCache.add(entry1);
      await serverRandomnessCache.add(entry2);

      const size = await serverRandomnessCache.size();
      expect(size).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return empty array when cache is empty', async () => {
      const entries = await serverRandomnessCache.getAll();

      expect(entries).toEqual([]);
    });

    it('should return entries sorted by block (newest first)', async () => {
      await serverRandomnessCache.add(createEntry(100));
      await serverRandomnessCache.add(createEntry(102));
      await serverRandomnessCache.add(createEntry(101));

      const entries = await serverRandomnessCache.getAll();

      expect(entries.length).toBe(3);
      expect(entries[0].block).toBe(102);
      expect(entries[1].block).toBe(101);
      expect(entries[2].block).toBe(100);
    });
  });

  describe('has', () => {
    it('should return false for non-existent block', async () => {
      const result = await serverRandomnessCache.has(999);

      expect(result).toBe(false);
    });

    it('should return true for existing block', async () => {
      await serverRandomnessCache.add(createEntry(100));

      const result = await serverRandomnessCache.has(100);

      expect(result).toBe(true);
    });
  });

  describe('getLatest', () => {
    it('should return null when cache is empty', async () => {
      const latest = await serverRandomnessCache.getLatest();

      expect(latest).toBeNull();
    });

    it('should return the entry with highest block number', async () => {
      await serverRandomnessCache.add(createEntry(100));
      await serverRandomnessCache.add(createEntry(105));
      await serverRandomnessCache.add(createEntry(102));

      const latest = await serverRandomnessCache.getLatest();

      expect(latest).not.toBeNull();
      expect(latest!.block).toBe(105);
    });
  });

  describe('clear', () => {
    it('should remove all entries', async () => {
      await serverRandomnessCache.add(createEntry(100));
      await serverRandomnessCache.add(createEntry(101));

      await serverRandomnessCache.clear();

      const size = await serverRandomnessCache.size();
      expect(size).toBe(0);
    });
  });

  describe('isInitialized', () => {
    it('should return false initially', async () => {
      const initialized = await serverRandomnessCache.isInitialized();

      expect(initialized).toBe(false);
    });

    it('should return true after setInitialized(true)', async () => {
      await serverRandomnessCache.setInitialized(true);

      const initialized = await serverRandomnessCache.isInitialized();

      expect(initialized).toBe(true);
    });

    it('should return false after setInitialized(false)', async () => {
      await serverRandomnessCache.setInitialized(true);
      await serverRandomnessCache.setInitialized(false);

      const initialized = await serverRandomnessCache.isInitialized();

      expect(initialized).toBe(false);
    });
  });
});
