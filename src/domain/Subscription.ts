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
 * Origin kind for XCM dispatch.
 * Matches the OriginKind enum from the idn-manager pallet (primitives.rs).
 */
export type OriginKind = 'Native' | 'SovereignAccount' | 'Superuser' | 'Xcm';

/**
 * Represents the possible states of a subscription.
 * - Active: Subscription is currently receiving random values
 * - Paused: Subscription is temporarily suspended but can be reactivated
 * - Finalized: Subscription is finalized and cannot be resumed
 */
export enum SubscriptionState {
  Active = 'Active',
  Paused = 'Paused',
  Finalized = 'Finalized',
}

/**
 * Contains the immutable details of a subscription.
 * Matches the pallet's SubscriptionDetails struct (lib.rs:176-185).
 *
 * These are the core parameters that identify where and how
 * randomness should be delivered.
 */
export class SubscriptionDetails {
  constructor(
    /** The account that created and owns the subscription */
    public subscriber: string,
    /** XCM location where random values should be delivered */
    public target: string,
    /** Pre-encoded call data as hex string (e.g., '0x2a03') */
    public call: string,
    /** Origin kind for XCM dispatch */
    public originKind: OriginKind = 'Native'
  ) {}
}

/**
 * Represents a subscription for randomness delivery.
 * Matches the pallet's Subscription struct (lib.rs:146-167).
 *
 * This class encapsulates both the immutable details of a subscription
 * and its current state (credits remaining, active/paused status).
 */
export class Subscription {
  constructor(
    /** Unique identifier for the subscription */
    public id: string,
    /** Core subscription parameters (subscriber, target, call, originKind) */
    public details: SubscriptionDetails,
    /** Number of random values yet to be delivered */
    public creditsLeft: number,
    /** Current state of the subscription */
    public state: SubscriptionState = SubscriptionState.Active,
    /** Block number when the subscription was created */
    public createdAt: number,
    /** Block number when the subscription was last updated */
    public updatedAt: number,
    /** Total credits subscribed for */
    public credits: number,
    /** How often to receive pulses (in blocks) */
    public frequency: number,
    /** Optional metadata for the subscription */
    public metadata: string | null = null,
    /** Last block in which a pulse was delivered (optional) */
    public lastDelivered: number | null = null
  ) {}

  /**
   * Calculates the number of credits already consumed.
   */
  get creditsConsumed(): number {
    return this.credits - this.creditsLeft;
  }

  /**
   * Creates a new subscription with the specified parameters.
   * This factory method handles the proper initialization of all
   * subscription fields, including timestamps and initial state.
   *
   * @param subscriber - Address of the account creating the subscription
   * @param target - XCM location for delivery
   * @param call - Pre-encoded call data as hex string
   * @param originKind - Origin kind for XCM dispatch
   * @param credits - Total number of random values requested
   * @param frequency - Blocks between deliveries
   * @param metadata - Optional additional data
   * @returns A new Subscription instance
   */
  static create(
    subscriber: string,
    target: string,
    call: string,
    originKind: OriginKind,
    credits: number,
    frequency: number,
    metadata: string | null = null
  ): Subscription {
    const now = Date.now();
    const details = new SubscriptionDetails(subscriber, target, call, originKind);

    return new Subscription(
      `${subscriber}-${now}`, // Simple ID generation for mock
      details,
      credits, // creditsLeft starts as full amount
      SubscriptionState.Active,
      now, // createdAt
      now, // updatedAt
      credits,
      frequency,
      metadata,
      null // lastDelivered
    );
  }
}
