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

import type { IPolkadotApiService } from '@/services/IPolkadotApiService';
import BN from 'bn.js';

/**
 * Transaction result status types for simulating blockchain responses
 */
export type TransactionStatus =
  | 'inBlock'
  | 'finalized'
  | 'dropped'
  | 'invalid'
  | 'usurped'
  | 'timeout';

/**
 * Options for configuring mock transaction behavior
 */
export interface MockTransactionOptions {
  status: TransactionStatus;
  dispatchError?: {
    isModule: boolean;
    asModule?: { error: number; index: number };
    toString?: () => string;
  };
  eventType?: string; // e.g., 'SubscriptionCreated', 'SubscriptionPaused'
}

/**
 * Creates a mock extrinsic that simulates signAndSend behavior
 */
export function createMockExtrinsic(options: MockTransactionOptions = { status: 'inBlock' }) {
  return {
    signAndSend: jest.fn().mockImplementation((_address, _options, callback) => {
      // Simulate async transaction processing
      setTimeout(() => {
        const status = {
          isInBlock: options.status === 'inBlock',
          isFinalized: options.status === 'finalized',
          isDropped: options.status === 'dropped',
          isInvalid: options.status === 'invalid',
          isUsurped: options.status === 'usurped',
          type: options.status.charAt(0).toUpperCase() + options.status.slice(1),
        };

        const events = options.eventType ? [{ event: { type: options.eventType } }] : [];

        callback({
          status,
          events,
          dispatchError: options.dispatchError || null,
        });
      }, 10);

      return Promise.resolve(() => {}); // Unsubscribe function
    }),
  };
}

/**
 * Creates a mock subscription data object matching pallet structure
 */
export function createMockSubscriptionData(overrides: Partial<MockSubscriptionData> = {}) {
  const defaults: MockSubscriptionData = {
    id: 'test-sub-1',
    state: 'Active',
    creditsLeft: 100,
    createdAt: 1000,
    updatedAt: 1000,
    credits: 100,
    frequency: 10,
    metadata: 'Test subscription',
    lastDelivered: null,
    details: {
      subscriber: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      target: { parents: 0, interior: 'Here' },
      call: '0x2a03',
      originKind: 'Native',
    },
  };

  return {
    ...defaults,
    ...overrides,
    isEmpty: false,
    toHuman: () => ({ ...defaults, ...overrides }),
    toJSON: () => ({ ...defaults, ...overrides }),
  };
}

export interface MockSubscriptionData {
  id: string;
  state: string;
  creditsLeft: number;
  createdAt: number;
  updatedAt: number;
  credits: number;
  frequency: number;
  metadata: string | null;
  lastDelivered: number | null;
  details: {
    subscriber: string;
    target: any;
    call: string;
    originKind: string;
  };
}

/**
 * Mock Polkadot API for testing
 */
export function createMockApi(overrides: Partial<MockApiOptions> = {}) {
  const options: MockApiOptions = {
    chainDecimals: [12],
    chainTokens: ['IDN'],
    freeBalance: '50000000000000', // 50 tokens with 12 decimals
    ...overrides,
  };

  const mockFreeBalance = new BN(options.freeBalance);

  // Default mock extrinsic that succeeds
  const defaultExtrinsic = createMockExtrinsic({ status: 'inBlock' });

  return {
    registry: {
      chainDecimals: options.chainDecimals,
      chainTokens: options.chainTokens,
      findMetaError: jest.fn().mockReturnValue({
        docs: ['Mock error documentation'],
        name: 'MockError',
        section: 'idnManager',
      }),
    },
    query: {
      system: {
        account: jest.fn().mockResolvedValue({
          data: {
            free: mockFreeBalance,
          },
        }),
        events: {
          at: jest.fn().mockResolvedValue([]),
        },
      },
      session: {
        currentIndex: jest.fn().mockResolvedValue({
          toString: () => '10',
        }),
      },
      scheduler: {
        agenda: {
          entries: jest.fn().mockResolvedValue([]),
        },
      },
      randomnessBeacon: {
        pulses: jest.fn().mockResolvedValue({
          toHuman: () => null,
        }),
      },
      idnManager: {
        subscriptions: Object.assign(jest.fn().mockResolvedValue(createMockSubscriptionData()), {
          entries: jest.fn().mockResolvedValue([]),
          keys: jest.fn().mockResolvedValue([]),
        }),
      },
    },
    rpc: {
      chain: {
        subscribeNewHeads: jest.fn().mockImplementation(callback => {
          // Simulate a block header
          callback({
            number: { toNumber: () => 100 },
            hash: { toHex: () => '0x1234' },
            parentHash: { toHex: () => '0x5678' },
            stateRoot: { toHex: () => '0xabcd' },
            extrinsicsRoot: { toHex: () => '0xefgh' },
          });
          return Promise.resolve(() => {});
        }),
        getBlockHash: jest.fn().mockResolvedValue('0x1234'),
      },
      idnManagerApi: {
        getSubscription: jest.fn().mockResolvedValue(createMockSubscriptionData()),
        getSubscriptionsForSubscriber: jest.fn().mockResolvedValue([]),
      },
    },
    call: {
      idnManagerApi: {
        calculateSubscriptionFees: jest.fn().mockResolvedValue({
          toNumber: () => 1000000000000, // 1 token
          toString: () => '1000000000000',
        }),
        getAllSubscriptions: jest.fn().mockResolvedValue([]),
      },
    },
    derive: {
      session: {
        progress: jest.fn().mockResolvedValue({
          sessionProgress: { toNumber: () => 50 },
          sessionLength: { toNumber: () => 100 },
          eraProgress: { toNumber: () => 500 },
          sessionsPerEra: { toNumber: () => 6 },
        }),
      },
    },
    tx: {
      idnManager: {
        createSubscription: jest.fn().mockReturnValue(defaultExtrinsic),
        pauseSubscription: jest.fn().mockReturnValue(defaultExtrinsic),
        killSubscription: jest.fn().mockReturnValue(defaultExtrinsic),
        updateSubscription: jest.fn().mockReturnValue(defaultExtrinsic),
        reactivateSubscription: jest.fn().mockReturnValue(defaultExtrinsic),
      },
    },
    events: {
      idnManager: {
        SubscriptionCreated: { is: jest.fn().mockReturnValue(false) },
        SubscriptionPaused: { is: jest.fn().mockReturnValue(false) },
        SubscriptionTerminated: { is: jest.fn().mockReturnValue(false) },
        SubscriptionUpdated: { is: jest.fn().mockReturnValue(false) },
        SubscriptionReactivated: { is: jest.fn().mockReturnValue(false) },
      },
    },
  };
}

export interface MockApiOptions {
  chainDecimals: number[];
  chainTokens: string[];
  freeBalance: string;
}

/**
 * Mock implementation of IPolkadotApiService for testing
 */
export class MockPolkadotApiService implements IPolkadotApiService {
  private mockApi: ReturnType<typeof createMockApi>;
  private ready = true;

  constructor(apiOptions: Partial<MockApiOptions> = {}) {
    this.mockApi = createMockApi(apiOptions);
  }

  async getApi(): Promise<any> {
    if (!this.ready) {
      throw new Error('API not ready');
    }
    return this.mockApi;
  }

  async isReady(): Promise<boolean> {
    return this.ready;
  }

  async disconnect(): Promise<void> {
    this.ready = false;
  }

  onReady(callback: () => void): void {
    if (this.ready) {
      callback();
    }
  }

  onDisconnect(_callback: () => void): void {
    // No-op for mock
  }

  onError(_callback: (error: Error) => void): void {
    // No-op for mock
  }

  // Test helpers
  setReady(ready: boolean): void {
    this.ready = ready;
  }

  getMockApi(): ReturnType<typeof createMockApi> {
    return this.mockApi;
  }
}
