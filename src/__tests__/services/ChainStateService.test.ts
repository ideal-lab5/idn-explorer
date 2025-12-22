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

import { ChainStateService } from '@/services/ChainStateService';
import 'reflect-metadata';
import { MockPolkadotApiService } from '../mocks/MockPolkadotApiService';

describe('ChainStateService', () => {
  let chainStateService: ChainStateService;
  let mockApiService: MockPolkadotApiService;

  beforeEach(() => {
    mockApiService = new MockPolkadotApiService({
      chainDecimals: [12],
      chainTokens: ['IDN'],
      freeBalance: '50000000000000', // 50 tokens with 12 decimals
    });
    chainStateService = new ChainStateService(mockApiService);
  });

  describe('getBalance', () => {
    it('should return formatted balance with token symbol', async () => {
      const balance = await chainStateService.getBalance(
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
      );

      expect(balance).toContain('IDN');
    });

    it('should handle different token symbols', async () => {
      mockApiService = new MockPolkadotApiService({
        chainDecimals: [10],
        chainTokens: ['DOT'],
        freeBalance: '100000000000',
      });
      chainStateService = new ChainStateService(mockApiService);

      const balance = await chainStateService.getBalance(
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
      );

      expect(balance).toContain('DOT');
    });

    it('should return "0" on error', async () => {
      mockApiService.setReady(false);

      const balance = await chainStateService.getBalance(
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
      );

      expect(balance).toBe('0');
    });
  });

  describe('getSessionInfo', () => {
    it('should return session information', async () => {
      const sessionInfo = await chainStateService.getSessionInfo();

      expect(sessionInfo).toEqual({
        sessionProgress: 50,
        sessionLength: 100,
        eraProgress: 500,
        sessionsPerEra: 6,
      });
    });
  });

  describe('getSessionIndex', () => {
    it('should return session index from chain', async () => {
      const sessionIndex = await chainStateService.getSessionIndex();

      expect(sessionIndex).toBe(10);
    });
  });

  describe('subscribeToNewHeaders', () => {
    it('should call callback with block header', async () => {
      const callback = jest.fn();

      await chainStateService.subscribeToNewHeaders(callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          blockNumber: 100,
          blockHash: '0x1234',
        })
      );
    });

    it('should return unsubscribe function', async () => {
      const callback = jest.fn();

      const unsubscribe = await chainStateService.subscribeToNewHeaders(callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('subscribeToBlocks', () => {
    it('should call callback with block number', async () => {
      const callback = jest.fn();

      await chainStateService.subscribeToBlocks(callback);

      expect(callback).toHaveBeenCalledWith(100);
    });
  });
});
