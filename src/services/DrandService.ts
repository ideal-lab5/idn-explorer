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

import { injectable } from 'tsyringe';
import type { DrandChainInfo, DrandPulse, IDrandService } from './IDrandService';

@injectable()
export class DrandService implements IDrandService {
  private readonly QUICKNET_CHAIN_HASH =
    process.env.NEXT_PUBLIC_QUICKNET_CHAIN_HASH ||
    '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';
  private readonly DRAND_API_URL = process.env.NEXT_PUBLIC_DRAND_API_URL || 'https://api.drand.sh';
  private chainInfo: DrandChainInfo | null = null;

  async getLatestPulse(): Promise<DrandPulse> {
    const response = await fetch(`${this.DRAND_API_URL}/${this.QUICKNET_CHAIN_HASH}/public/latest`);
    if (!response.ok) {
      throw new Error(`Failed to fetch latest pulse: ${response.statusText}`);
    }
    return response.json();
  }

  async getCurrentRound(): Promise<number> {
    const pulse = await this.getLatestPulse();
    return pulse.round;
  }

  async getChainInfo(): Promise<DrandChainInfo> {
    if (this.chainInfo) {
      return this.chainInfo;
    }

    const response = await fetch(`${this.DRAND_API_URL}/${this.QUICKNET_CHAIN_HASH}/info`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chain info: ${response.statusText}`);
    }
    this.chainInfo = await response.json();
    return this.chainInfo!;
  }

  getRoundAtTime(timestamp: number): number {
    if (!this.chainInfo) {
      throw new Error('Chain info not loaded. Call getChainInfo() first.');
    }

    const { genesis_time, period } = this.chainInfo;
    const elapsedTime = timestamp - genesis_time;

    if (elapsedTime < 0) {
      return 1;
    }

    return Math.floor(elapsedTime / period) + 1;
  }
}
