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
 * In-memory mock implementation of Redis for testing
 */
export class MockRedis {
  private sortedSets: Map<string, Map<string, number>> = new Map();
  private hashes: Map<string, Map<string, string>> = new Map();
  private strings: Map<string, { value: string; expiry?: number }> = new Map();

  // Sorted Set operations
  async zadd(key: string, options: { score: number; member: string }): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    const isNew = !set.has(options.member);
    set.set(options.member, options.score);
    return isNew ? 1 : 0;
  }

  async zrange<T = string[]>(
    key: string,
    start: number,
    stop: number,
    options?: { rev?: boolean; byScore?: boolean }
  ): Promise<T> {
    const set = this.sortedSets.get(key);
    if (!set) return [] as unknown as T;

    let entries = Array.from(set.entries());

    if (options?.byScore) {
      // Filter by score range
      entries = entries.filter(([_, score]) => score >= start && score <= stop);
    }

    // Sort by score
    entries.sort((a, b) => (options?.rev ? b[1] - a[1] : a[1] - b[1]));

    if (!options?.byScore) {
      // Slice by index
      const end = stop === -1 ? entries.length : stop + 1;
      entries = entries.slice(start < 0 ? entries.length + start : start, end);
    }

    return entries.map(([member]) => member) as unknown as T;
  }

  async zcard(key: string): Promise<number> {
    return this.sortedSets.get(key)?.size || 0;
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;

    const entries = Array.from(set.entries()).sort((a, b) => a[1] - b[1]);
    const toRemove = entries.slice(start, stop + 1);

    toRemove.forEach(([member]) => set.delete(member));
    return toRemove.length;
  }

  // Hash operations
  async hset(key: string, data: Record<string, string>): Promise<number> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    const hash = this.hashes.get(key)!;
    let count = 0;
    for (const [field, value] of Object.entries(data)) {
      if (!hash.has(field)) count++;
      hash.set(field, value);
    }
    return count;
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.hashes.get(key)?.get(field) || null;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashes.get(key);
    if (!hash) return 0;

    let count = 0;
    for (const field of fields) {
      if (hash.delete(field)) count++;
    }
    return count;
  }

  async hexists(key: string, field: string): Promise<number> {
    return this.hashes.get(key)?.has(field) ? 1 : 0;
  }

  // String operations
  async set(key: string, value: string, options?: { ex?: number }): Promise<string> {
    this.strings.set(key, {
      value,
      expiry: options?.ex ? Date.now() + options.ex * 1000 : undefined,
    });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const entry = this.strings.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.strings.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<number> {
    const deleted =
      this.sortedSets.delete(key) || this.hashes.delete(key) || this.strings.delete(key);
    return deleted ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.strings.get(key);
    if (entry) {
      entry.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  // Test helpers
  clear(): void {
    this.sortedSets.clear();
    this.hashes.clear();
    this.strings.clear();
  }
}

// Singleton instance for tests
export const mockRedis = new MockRedis();
