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

// Mock the timelock.js module before importing ExplorerService
jest.mock('@ideallabs/timelock.js', () => ({
  Timelock: {
    build: jest.fn().mockResolvedValue({
      encrypt: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
  },
  SupportedCurve: {
    BLS12_381: 'bls12_381',
  },
  DrandIdentityBuilder: {},
  u8a: {},
}));

import 'reflect-metadata';
import { ExplorerService } from '@/services/ExplorerService';
import { MockPolkadotApiService } from '../mocks/MockPolkadotApiService';

describe('ExplorerService', () => {
  let explorerService: ExplorerService;
  let mockApiService: MockPolkadotApiService;

  beforeEach(() => {
    mockApiService = new MockPolkadotApiService({
      chainDecimals: [12],
      chainTokens: ['IDN'],
      freeBalance: '50000000000000', // 50 tokens with 12 decimals
    });
    explorerService = new ExplorerService(mockApiService);
  });

  describe('getFreeBalance', () => {
    it('should return formatted balance with token symbol', async () => {
      const signer = { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' };

      const balance = await explorerService.getFreeBalance(signer);

      expect(balance).toContain('IDN');
    });

    it('should handle different token symbols', async () => {
      mockApiService = new MockPolkadotApiService({
        chainDecimals: [10],
        chainTokens: ['DOT'],
        freeBalance: '100000000000',
      });
      explorerService = new ExplorerService(mockApiService);
      const signer = { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' };

      const balance = await explorerService.getFreeBalance(signer);

      expect(balance).toContain('DOT');
    });

    it('should return "0" on error', async () => {
      mockApiService.setReady(false);
      const signer = { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' };

      const balance = await explorerService.getFreeBalance(signer);

      expect(balance).toBe('0');
    });

    it('should format balance without excessive decimals', async () => {
      const signer = { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty' };

      const balance = await explorerService.getFreeBalance(signer);

      // Should not have excessive trailing zeros
      expect(balance).not.toMatch(/\.0{5,}/);
    });
  });

  describe('getScheduledTransactions', () => {
    it('should return empty array when no scheduled transactions', async () => {
      const transactions = await explorerService.getScheduledTransactions();

      expect(transactions).toEqual([]);
    });
  });

  describe('getRandomness', () => {
    it('should return empty array when no randomness data', async () => {
      const randomness = await explorerService.getRandomness(100, 10);

      expect(randomness).toEqual([]);
    });

    it('should handle missing randomnessBeacon pallet', async () => {
      const mockApi = mockApiService.getMockApi();
      (mockApi.query as any).randomnessBeacon = undefined;

      const randomness = await explorerService.getRandomness(100, 10);

      expect(randomness).toEqual([]);
    });
  });

  describe('queryHistoricalEvents', () => {
    it('should return empty array for empty block range', async () => {
      const events = await explorerService.queryHistoricalEvents(100, 100);

      expect(events).toEqual([]);
    });
  });
});
