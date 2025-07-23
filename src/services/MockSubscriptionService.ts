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
import type { Subscription, SubscriptionDetails } from '../domain/Subscription';
import {
  Subscription as SubscriptionClass,
  SubscriptionDetails as SubscriptionDetailsClass,
  SubscriptionState,
} from '../domain/Subscription';
import type {
  ISubscriptionService,
  UpdateSubscriptionParams,
  XcmLocation,
} from './ISubscriptionService';

/**
 * Mock implementation of the subscription service.
 * This class provides a working implementation that stores subscriptions in memory,
 * useful for testing and development before integrating with the actual blockchain.
 *
 * The implementation mirrors the behavior of the idn-manager pallet:
 * - Maintains subscription state
 * - Enforces ownership checks
 * - Manages subscription lifecycle
 * - Simulates both extrinsic and RPC calls to the blockchain
 */
@injectable()
export class MockSubscriptionService implements ISubscriptionService {
  /** In-memory storage of subscriptions, keyed by subscription ID */
  private subscriptions: Map<string, Subscription> = new Map();

  constructor() {
    // Initialize with sample subscriptions for demo purposes
    this.initializeSampleSubscriptions();
  }

  /**
   * Initialize sample subscription data for demonstration purposes
   */
  private initializeSampleSubscriptions() {
    const mockAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

    // Sample subscription 1: Active parachain randomness service
    const details1 = new SubscriptionDetailsClass(
      mockAddress,
      Date.now(),
      Date.now(),
      100000,
      120,
      'para(2004)/pallet-randomness/0x1234567890abcdef',
      'Parachain Randomness',
      '0x2a05' // Call index as hex string
    );
    const sub1 = new SubscriptionClass(
      'sub-1-parachain-randomness',
      details1,
      15000, // creditsLeft = amount - consumed
      SubscriptionState.Active,
      85000 // creditsConsumed
    );

    // Sample subscription 2: Paused VRF service
    const details2 = new SubscriptionDetailsClass(
      mockAddress,
      Date.now(),
      Date.now(),
      50000,
      60,
      'para(2012)/pallet-vrf/0xabcdef1234567890',
      'VRF Service',
      '0x1b02' // Call index as hex string
    );
    const sub2 = new SubscriptionClass(
      'sub-2-vrf-service',
      details2,
      8500, // creditsLeft = amount - consumed
      SubscriptionState.Paused,
      41500 // creditsConsumed
    );

    // Sample subscription 3: Active smart contract randomness
    const details3 = new SubscriptionDetailsClass(
      mockAddress,
      Date.now(),
      Date.now(),
      200000,
      90,
      'para(2008)/pallet-contracts/0x9876543210fedcba',
      'Smart Contract RNG',
      '0x3c07' // Call index as hex string
    );
    const sub3 = new SubscriptionClass(
      'sub-3-smart-contract-rng',
      details3,
      25000, // creditsLeft = amount - consumed
      SubscriptionState.Active,
      175000 // creditsConsumed
    );

    // Add the sample subscriptions to our map
    this.subscriptions.set(sub1.id, sub1);
    this.subscriptions.set(sub2.id, sub2);
    this.subscriptions.set(sub3.id, sub3);
  }

  /**
   * Creates a new subscription for randomness delivery.
   *
   * @param signer Account that will own the subscription
   * @param credits Total number of random values to receive (was amount)
   * @param target XCM location where random values will be delivered
   * @param callIndex Two-byte array [pallet_index, call_index] for XCM dispatch
   * @param frequency Number of blocks between each delivery
   * @param metadata Optional additional data for the subscription
   * @param subscriptionId Optional subscription ID, auto-generated if not provided
   */
  async createSubscription(
    signer: any,
    credits: number,
    target: XcmLocation,
    callIndex: [number, number],
    frequency: number,
    metadata?: string,
    subscriptionId?: string
  ): Promise<void> {
    // Calculate a mock deposit based on the parameters
    const targetString = `XCM:${target.parents}:${JSON.stringify(target.interior)}`;
    const deposit = this.calculateStorageDeposit(credits, targetString, metadata);

    const newId = subscriptionId || `sub-${Date.now()}`;
    const details = new SubscriptionDetailsClass(
      signer.address || 'unknown',
      Date.now(),
      Date.now(),
      credits,
      frequency,
      targetString,
      metadata || '',
      '0x0000' // Default call index as hex string
    );
    const subscription = new SubscriptionClass(
      newId,
      details,
      credits, // creditsLeft starts as full amount
      SubscriptionState.Active,
      0, // creditsConsumed starts at 0
      0 // feesPaid starts at 0
    );

    this.subscriptions.set(subscription.id, subscription);
  }

  /**
   * Pauses an existing subscription.
   *
   * @param signer The signer of the subscription.
   * @param subscriptionId The ID of the subscription to pause.
   */
  async pauseSubscription(signer: any, subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.details.subscriber !== signer.address) throw new Error('Unauthorized');

    subscription.state = SubscriptionState.Paused;
    this.subscriptions.set(subscriptionId, subscription);
  }

  /**
   * Kills an existing subscription.
   *
   * @param signer The signer of the subscription.
   * @param subscriptionId The ID of the subscription to kill.
   */
  async killSubscription(signer: any, subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.details.subscriber !== signer.address) throw new Error('Unauthorized');

    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Updates an existing subscription.
   *
   * @param signer The signer of the subscription.
   * @param params Parameters to update including subscriptionId and optional values
   */
  async updateSubscription(signer: any, params: UpdateSubscriptionParams): Promise<void> {
    const subscription = this.subscriptions.get(params.subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.details.subscriber !== signer.address) throw new Error('Unauthorized');

    // Update only the provided parameters
    if (params.amount !== undefined) {
      subscription.details.amount = params.amount;
      // Update credits left if amount increased
      const addedCredits =
        params.amount - (subscription.creditsLeft + subscription.creditsConsumed);
      if (addedCredits > 0) {
        subscription.creditsLeft += addedCredits;
      }
    }

    if (params.frequency !== undefined) {
      subscription.details.frequency = params.frequency;
    }

    if (params.metadata !== undefined) {
      subscription.details.metadata = params.metadata;
    }

    // PulseFilter support removed

    subscription.details.updatedAt = Date.now();
    this.subscriptions.set(params.subscriptionId, subscription);
  }

  /**
   * Reactivates a paused subscription.
   *
   * @param signer The signer of the subscription.
   * @param subscriptionId The ID of the subscription to reactivate.
   */
  async reactivateSubscription(signer: any, subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.details.subscriber !== signer.address) throw new Error('Unauthorized');

    subscription.state = SubscriptionState.Active;
    this.subscriptions.set(subscriptionId, subscription);
  }

  /**
   * Retrieves a subscription by ID.
   *
   * @param subscriptionId The ID of the subscription to retrieve.
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  }

  /**
   * Calculates the fees for a given number of credits without creating a subscription.
   * Simulates calling the runtime API's calculate_subscription_fees RPC method.
   *
   * @param amount Number of random values to receive
   * @returns The calculated fee
   */
  async calculateSubscriptionFees(amount: number): Promise<number> {
    // Simple mock implementation - in a real implementation this would
    // call the runtime API's calculate_subscription_fees method
    const baseRate = 0.01; // Mock base rate per unit
    return amount * baseRate;
  }

  /**
   * Retrieves all subscriptions for a specific account.
   * In this mock implementation, we return all subscriptions for easier testing/demo.
   *
   * @param accountId Account ID to fetch subscriptions for (ignored in this mock)
   * @returns Array of all sample subscriptions
   */
  async getSubscriptionsForAccount(accountId: string): Promise<Subscription[]> {
    // For demo/testing purposes, return all subscriptions without filtering
    return Array.from(this.subscriptions.values());
  }

  /**
   * Retrieves all subscriptions in the system.
   * Useful for dashboard and analytics views.
   *
   * @returns Array of all subscriptions
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Calculates a mock storage deposit based on subscription parameters.
   * This would be replaced with actual blockchain-based calculation in a real implementation.
   *
   * @param amount Number of random values
   * @param target XCM target location
   * @param metadata Optional metadata string
   * @returns The calculated storage deposit amount
   */
  private calculateStorageDeposit(amount: number, target: string, metadata?: string): number {
    // Base deposit
    let deposit = 1.0;

    // Add for target complexity (simple mock calculation)
    deposit += target.length * 0.01;

    // Add for metadata if present
    if (metadata) {
      deposit += metadata.length * 0.005;
    }

    // No longer using pulse filter

    return deposit;
  }
}
