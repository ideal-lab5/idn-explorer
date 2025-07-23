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
 * This module contains the domain entities for handling randomness subscriptions.
 * It mirrors the structure defined in the idn-manager pallet and provides
 * type-safe representations of subscription data.
 */

/**
 * Represents the possible states of a subscription.
 * - Active: Subscription is currently receiving random values
 * - Paused: Subscription is temporarily suspended but can be reactivated
 */
export enum SubscriptionState {
  Active = 'Active',
  Paused = 'Paused',
}

// PulseFilter implementation removed

/**
 * Contains the immutable details of a subscription.
 * These details are set when the subscription is created and
 * represent the core parameters of the randomness delivery service.
 */
export class SubscriptionDetails {
  constructor(
    /** The account that created and owns the subscription */
    public subscriber: string,
    /** Timestamp when the subscription was created */
    public createdAt: number,
    /** Timestamp of the last update to the subscription */
    public updatedAt: number,
    /** Total number of random values requested */
    public amount: number,
    /** Number of blocks between each random value delivery */
    public frequency: number,
    /** XCM location where random values should be delivered */
    public target: string,
    /** Additional data associated with the subscription */
    public metadata: string,
    /** Call index in hex format (e.g., '0x2a03') */
    public callIndex: string,
    /** The storage deposit locked for this subscription */
    public deposit: number = 0
  ) {}
}

/**
 * Represents a subscription for randomness delivery.
 * This class encapsulates both the immutable details of a subscription
 * and its current state (credits remaining, active/paused status).
 *
 * The structure mirrors the on-chain subscription data structure from
 * the idn-manager pallet, ensuring type-safe interaction with the blockchain.
 */
export class Subscription {
  constructor(
    /** Unique identifier for the subscription */
    public id: string,
    /** Core subscription parameters */
    public details: SubscriptionDetails,
    /** Number of random values yet to be delivered */
    public creditsLeft: number,
    /** Current state of the subscription */
    public state: SubscriptionState = SubscriptionState.Active,
    /** Number of credits already consumed */
    public creditsConsumed: number = 0,
    /** Total fees paid for consumed credits */
    public feesPaid: number = 0
  ) {}

  /**
   * Creates a new subscription with the specified parameters.
   * This factory method handles the proper initialization of all
   * subscription fields, including timestamps and initial state.
   *
   * @param subscriber - Address of the account creating the subscription
   * @param amount - Total number of random values requested
   * @param target - XCM location for delivery
   * @param frequency - Blocks between deliveries
   * @param metadata - Optional additional data
   * @returns A new Subscription instance
   */
  static create(
    subscriber: string,
    amount: number,
    target: string,
    frequency: number,
    metadata: string = '',
    callIndex: string = '',
    deposit: number = 0
  ): Subscription {
    const now = Date.now();
    const details = new SubscriptionDetails(
      subscriber,
      now,
      now,
      amount,
      frequency,
      target,
      metadata,
      callIndex,
      deposit
    );

    return new Subscription(
      `${subscriber}-${now}`, // Simple ID generation for mock
      details,
      amount,
      SubscriptionState.Active,
      0, // creditsConsumed
      0 // feesPaid
    );
  }
}
