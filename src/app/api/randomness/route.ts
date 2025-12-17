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

import { serverRandomnessCache } from '@/lib/server/randomnessCache';
import { randomnessSubscriptionManager } from '@/lib/server/randomnessSubscription';
import { NextResponse } from 'next/server';

/**
 * GET /api/randomness
 * Returns the cached randomness values from the Redis cache.
 * Initializes the subscription if not already running.
 */
export async function GET() {
  try {
    // Initialize subscription if not already running
    // This is lazy initialization - starts on first request
    const isInitialized = await serverRandomnessCache.isInitialized();
    if (!isInitialized) {
      // Don't await - let it initialize in the background
      randomnessSubscriptionManager.initialize().catch(console.error);
    }

    const data = await serverRandomnessCache.getAll();

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      initialized: isInitialized,
    });
  } catch (error) {
    console.error('[API /randomness] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch randomness data',
        data: [],
        count: 0,
        initialized: false,
      },
      { status: 500 }
    );
  }
}
