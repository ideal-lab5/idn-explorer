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
 * Redis client configuration using Upstash Redis.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.
 * Uses lazy initialization to avoid errors during build time.
 */

import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

/**
 * Get the Redis client instance.
 * Lazily initializes the client on first use to avoid build-time errors.
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.randomness_KV_REST_API_URL;
    const token = process.env.randomness_KV_REST_API_TOKEN;

    if (!url) {
      throw new Error('randomness_KV_REST_API_URL environment variable is required');
    }

    if (!token) {
      throw new Error('randomness_KV_REST_API_TOKEN environment variable is required');
    }

    redisInstance = new Redis({ url, token });
  }

  return redisInstance;
}
