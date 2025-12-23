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

import { SubscriptionState } from '@/domain/Subscription';
import { IdnSubscriptionService } from '@/services/IdnSubscriptionService';
import 'reflect-metadata';
import {
  MockPolkadotApiService,
  createMockExtrinsic,
  createMockSubscriptionData,
} from '../mocks/MockPolkadotApiService';

describe('IdnSubscriptionService', () => {
  let subscriptionService: IdnSubscriptionService;
  let mockApiService: MockPolkadotApiService;

  const mockSigner = {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    signer: { signPayload: jest.fn() },
  };

  const mockTarget = {
    parents: 1,
    interior: { x1: [{ type: 'parachain', value: { parachain: 2000 } }] },
  };

  beforeEach(() => {
    mockApiService = new MockPolkadotApiService();
    subscriptionService = new IdnSubscriptionService(mockApiService);
  });

  describe('createSubscription', () => {
    it('should create subscription successfully when transaction is included in block', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.createSubscription(
        mockSigner,
        100, // credits
        mockTarget,
        '0x2a03', // call data
        'Native',
        10, // frequency
        'Test subscription',
        'test-sub-id'
      );

      expect(mockApi.tx.idnManager.createSubscription).toHaveBeenCalledWith({
        credits: 100,
        target: expect.any(Object),
        call: [42, 3], // 0x2a03 converted to bytes
        origin_kind: 'Native',
        frequency: 10,
        metadata: 'Test subscription',
        sub_id: 'test-sub-id',
      });
    });

    it('should handle optional subscription ID', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.createSubscription(
        mockSigner,
        50,
        mockTarget,
        '0x1b02',
        'Native',
        5
      );

      expect(mockApi.tx.idnManager.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          credits: 50,
          sub_id: null,
          metadata: null,
        })
      );
    });

    it('should reject when transaction status is dropped', async () => {
      const mockApi = mockApiService.getMockApi();
      mockApi.tx.idnManager.createSubscription.mockReturnValue(
        createMockExtrinsic({ status: 'dropped' })
      );

      await expect(
        subscriptionService.createSubscription(mockSigner, 100, mockTarget, '0x2a03', 'Native', 10)
      ).rejects.toThrow('Transaction failed with status: Dropped');
    });

    it('should reject when transaction has dispatch error', async () => {
      const mockApi = mockApiService.getMockApi();
      mockApi.tx.idnManager.createSubscription.mockReturnValue(
        createMockExtrinsic({
          status: 'inBlock',
          dispatchError: {
            isModule: true,
            asModule: { error: 1, index: 50 },
          },
        })
      );

      await expect(
        subscriptionService.createSubscription(mockSigner, 100, mockTarget, '0x2a03', 'Native', 10)
      ).rejects.toThrow('idnManager.MockError');
    });

    it('should format XCM location with Here interior', async () => {
      const mockApi = mockApiService.getMockApi();
      const hereTarget = { parents: 0, interior: 'here' };

      await subscriptionService.createSubscription(
        mockSigner,
        100,
        hereTarget,
        '0x2a03',
        'Native',
        10
      );

      expect(mockApi.tx.idnManager.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { parents: 0, interior: 'Here' },
        })
      );
    });
  });

  describe('pauseSubscription', () => {
    it('should pause subscription successfully', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.pauseSubscription(mockSigner, 'sub-123');

      expect(mockApi.tx.idnManager.pauseSubscription).toHaveBeenCalledWith('sub-123');
    });

    it('should reject when transaction fails', async () => {
      const mockApi = mockApiService.getMockApi();
      mockApi.tx.idnManager.pauseSubscription.mockReturnValue(
        createMockExtrinsic({ status: 'invalid' })
      );

      await expect(subscriptionService.pauseSubscription(mockSigner, 'sub-123')).rejects.toThrow(
        'Transaction failed with status: Invalid'
      );
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate subscription successfully', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.reactivateSubscription(mockSigner, 'sub-123');

      expect(mockApi.tx.idnManager.reactivateSubscription).toHaveBeenCalledWith('sub-123');
    });

    it('should reject on dispatch error', async () => {
      const mockApi = mockApiService.getMockApi();
      mockApi.tx.idnManager.reactivateSubscription.mockReturnValue(
        createMockExtrinsic({
          status: 'inBlock',
          dispatchError: {
            isModule: false,
            toString: () => 'CannotReactivate',
          },
        })
      );

      await expect(
        subscriptionService.reactivateSubscription(mockSigner, 'sub-123')
      ).rejects.toThrow('CannotReactivate');
    });
  });

  describe('killSubscription', () => {
    it('should kill subscription successfully', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.killSubscription(mockSigner, 'sub-123');

      expect(mockApi.tx.idnManager.killSubscription).toHaveBeenCalledWith('sub-123');
    });

    it('should reject when transaction is usurped', async () => {
      const mockApi = mockApiService.getMockApi();
      mockApi.tx.idnManager.killSubscription.mockReturnValue(
        createMockExtrinsic({ status: 'usurped' })
      );

      await expect(subscriptionService.killSubscription(mockSigner, 'sub-123')).rejects.toThrow(
        'Transaction failed with status: Usurped'
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription with all parameters', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.updateSubscription(mockSigner, {
        subscriptionId: 'sub-123',
        amount: 200,
        frequency: 20,
        metadata: 'Updated metadata',
      });

      expect(mockApi.tx.idnManager.updateSubscription).toHaveBeenCalledWith({
        sub_id: 'sub-123',
        credits: 200,
        frequency: 20,
        metadata: 'Updated metadata',
      });
    });

    it('should update subscription with partial parameters', async () => {
      const mockApi = mockApiService.getMockApi();

      await subscriptionService.updateSubscription(mockSigner, {
        subscriptionId: 'sub-123',
        frequency: 30,
      });

      expect(mockApi.tx.idnManager.updateSubscription).toHaveBeenCalledWith({
        sub_id: 'sub-123',
        credits: null,
        frequency: 30,
        metadata: null,
      });
    });
  });

  describe('calculateSubscriptionFees', () => {
    it('should return calculated fees', async () => {
      const fees = await subscriptionService.calculateSubscriptionFees(100);

      expect(fees).toBe(1000000000000); // 1 token as mocked
    });

    it('should throw error when API fails', async () => {
      mockApiService.setReady(false);

      await expect(subscriptionService.calculateSubscriptionFees(100)).rejects.toThrow(
        'Failed to calculate subscription fees'
      );
    });
  });

  describe('getSubscription', () => {
    it('should return subscription from runtime API', async () => {
      const mockApi = mockApiService.getMockApi();
      const mockSubData = createMockSubscriptionData({ id: 'sub-456' });
      (mockApi.rpc as any).idnManagerApi.getSubscription.mockResolvedValue(mockSubData);

      const subscription = await subscriptionService.getSubscription('sub-456');

      expect(subscription.id).toBe('sub-456');
      expect(subscription.state).toBe(SubscriptionState.Active);
    });

    it('should fallback to storage when runtime API fails', async () => {
      const mockApi = mockApiService.getMockApi();
      (mockApi.rpc as any).idnManagerApi.getSubscription.mockRejectedValue(
        new Error('Runtime API not available')
      );

      const mockSubData = createMockSubscriptionData({ id: 'sub-789' });
      mockApi.query.idnManager.subscriptions.mockResolvedValue(mockSubData);

      const subscription = await subscriptionService.getSubscription('sub-789');

      expect(subscription.id).toBe('sub-789');
    });

    it('should throw when subscription not found', async () => {
      const mockApi = mockApiService.getMockApi();
      (mockApi.rpc as any).idnManagerApi.getSubscription.mockResolvedValue({
        isEmpty: true,
      });
      mockApi.query.idnManager.subscriptions.mockResolvedValue({
        isEmpty: true,
      });

      await expect(subscriptionService.getSubscription('non-existent')).rejects.toThrow(
        'Subscription with ID non-existent not found'
      );
    });
  });

  describe('getSubscriptionsForAccount', () => {
    it('should return subscriptions from runtime API', async () => {
      const mockApi = mockApiService.getMockApi();
      const mockSubs = [
        createMockSubscriptionData({ id: 'sub-1' }),
        createMockSubscriptionData({ id: 'sub-2' }),
      ];
      (mockApi.rpc as any).idnManagerApi.getSubscriptionsForSubscriber.mockResolvedValue(mockSubs);

      const subscriptions = await subscriptionService.getSubscriptionsForAccount(
        mockSigner.address
      );

      expect(subscriptions).toHaveLength(2);
      expect(subscriptions[0].id).toBe('sub-1');
      expect(subscriptions[1].id).toBe('sub-2');
    });

    it('should return empty array when no subscriptions found', async () => {
      const mockApi = mockApiService.getMockApi();
      (mockApi.rpc as any).idnManagerApi.getSubscriptionsForSubscriber.mockResolvedValue([]);

      const subscriptions = await subscriptionService.getSubscriptionsForAccount(
        mockSigner.address
      );

      expect(subscriptions).toEqual([]);
    });

    it('should use cache for subsequent calls', async () => {
      const mockApi = mockApiService.getMockApi();
      const mockSubs = [createMockSubscriptionData({ id: 'cached-sub' })];
      (mockApi.rpc as any).idnManagerApi.getSubscriptionsForSubscriber.mockResolvedValue(mockSubs);

      // First call
      await subscriptionService.getSubscriptionsForAccount(mockSigner.address);
      // Second call (should use cache)
      await subscriptionService.getSubscriptionsForAccount(mockSigner.address);

      expect(
        (mockApi.rpc as any).idnManagerApi.getSubscriptionsForSubscriber
      ).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on error', async () => {
      mockApiService.setReady(false);

      const subscriptions = await subscriptionService.getSubscriptionsForAccount(
        mockSigner.address
      );

      expect(subscriptions).toEqual([]);
    });
  });

  describe('getAllSubscriptions', () => {
    it('should return all subscriptions via runtime API', async () => {
      const mockApi = mockApiService.getMockApi();
      const mockSubs = [
        createMockSubscriptionData({ id: 'all-sub-1' }),
        createMockSubscriptionData({ id: 'all-sub-2' }),
      ];
      (mockApi.call as any).idnManagerApi.getAllSubscriptions.mockResolvedValue(mockSubs);

      const subscriptions = await subscriptionService.getAllSubscriptions();

      expect(subscriptions).toHaveLength(2);
    });

    it('should fallback to storage query when runtime API fails', async () => {
      const mockApi = mockApiService.getMockApi();
      (mockApi.call as any).idnManagerApi.getAllSubscriptions.mockRejectedValue(
        new Error('Not available')
      );

      const mockKeys = [
        { args: [{ toString: () => 'storage-sub-1' }] },
        { args: [{ toString: () => 'storage-sub-2' }] },
      ];
      mockApi.query.idnManager.subscriptions.keys.mockResolvedValue(mockKeys);
      mockApi.query.idnManager.subscriptions.mockResolvedValue(
        createMockSubscriptionData({ id: 'storage-sub' })
      );

      const subscriptions = await subscriptionService.getAllSubscriptions();

      expect(subscriptions.length).toBeGreaterThan(0);
    });

    it('should return empty array when no subscriptions exist', async () => {
      const mockApi = mockApiService.getMockApi();
      (mockApi.call as any).idnManagerApi = undefined;
      mockApi.query.idnManager.subscriptions.keys.mockResolvedValue([]);

      const subscriptions = await subscriptionService.getAllSubscriptions();

      expect(subscriptions).toEqual([]);
    });
  });

  describe('palletSubscriptionToSubscription conversion', () => {
    it('should correctly convert pallet data with all fields', async () => {
      const mockApi = mockApiService.getMockApi();
      const mockSubData = createMockSubscriptionData({
        id: 'full-sub',
        state: 'Paused',
        creditsLeft: 50,
        credits: 100,
        frequency: 15,
        metadata: 'Full test',
        lastDelivered: 500,
        details: {
          subscriber: mockSigner.address,
          target: { parents: 1, interior: { X1: { Parachain: 2000 } } },
          call: '0x2a03',
          originKind: 'SovereignAccount',
        },
      });
      (mockApi.rpc as any).idnManagerApi.getSubscription.mockResolvedValue(mockSubData);

      const subscription = await subscriptionService.getSubscription('full-sub');

      expect(subscription.id).toBe('full-sub');
      expect(subscription.state).toBe(SubscriptionState.Paused);
      expect(subscription.creditsLeft).toBe(50);
      expect(subscription.credits).toBe(100);
      expect(subscription.frequency).toBe(15);
      expect(subscription.metadata).toBe('Full test');
      expect(subscription.lastDelivered).toBe(500);
      expect(subscription.details.originKind).toBe('SovereignAccount');
    });

    it('should handle hex-encoded metadata', async () => {
      const mockApi = mockApiService.getMockApi();
      // "Test" in hex
      const hexMetadata = '0x54657374';
      const mockSubData = createMockSubscriptionData({
        id: 'hex-meta-sub',
        metadata: hexMetadata,
      });
      (mockApi.rpc as any).idnManagerApi.getSubscription.mockResolvedValue(mockSubData);

      const subscription = await subscriptionService.getSubscription('hex-meta-sub');

      expect(subscription.metadata).toBe('Test');
    });

    it('should handle Finalized state', async () => {
      const mockApi = mockApiService.getMockApi();
      const mockSubData = createMockSubscriptionData({
        id: 'finalized-sub',
        state: 'Finalized',
      });
      (mockApi.rpc as any).idnManagerApi.getSubscription.mockResolvedValue(mockSubData);

      const subscription = await subscriptionService.getSubscription('finalized-sub');

      expect(subscription.state).toBe(SubscriptionState.Finalized);
    });
  });
});
