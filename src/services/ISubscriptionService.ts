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

import { Subscription, PulseFilter } from '../domain/Subscription';

/**
 * Parameters for updating a subscription with optional fields.
 * When a field is undefined, it remains unchanged.
 */
export interface UpdateSubscriptionParams {
    subscriptionId: string;
    amount?: number;       // Optional new amount
    frequency?: number;    // Optional new frequency
    metadata?: string;     // Optional new metadata
    pulseFilter?: PulseFilter; // Optional new pulse filter
}



/**
 * Defines the interface for interacting with subscription data.
 * This service abstracts the underlying subscription management,
 * whether it's using mock data or actual blockchain interactions.
 * 
 * Methods are divided into two categories:
 * 1. Transaction methods: require a signer and modify chain state via extrinsics
 * 2. RPC methods: read-only operations that don't require a transaction
 */
export interface ISubscriptionService {
    
    /**
     * Creates a new subscription for randomness delivery.
     * 
     * @param signer - Account that will own the subscription
     * @param amount - Total number of random values to receive
     * @param target - XCM location where random values will be delivered
     * @param frequency - Number of blocks between each delivery
     * @param metadata - Optional additional data for the subscription
     * @param pulseFilter - Optional filter for which pulses to receive
     */
    createSubscription(
        signer: any, 
        amount: number,
        target: string,
        frequency: number,
        metadata?: string,
        pulseFilter?: PulseFilter
    ): Promise<void>;
    
    /**
     * Temporarily suspends randomness delivery for a subscription.
     * Only the subscription owner can pause their subscription.
     * 
     * @param signer - Must match the subscription's original creator
     * @param subscriptionId - ID of the subscription to pause
     */
    pauseSubscription(
        signer: any,
        subscriptionId: string
    ): Promise<void>;
    
    /**
     * Permanently terminates a subscription.
     * This will stop all future randomness deliveries and cannot be undone.
     * Only the subscription owner can kill their subscription.
     * 
     * @param signer - Must match the subscription's original creator
     * @param subscriptionId - ID of the subscription to terminate
     */
    killSubscription(
        signer: any,
        subscriptionId: string
    ): Promise<void>;
    
    /**
     * Updates the parameters of an existing subscription.
     * Only the subscription owner can modify their subscription.
     * Fields set to undefined will not be updated.
     * 
     * @param signer - Must match the subscription's original creator
     * @param params - Parameters to update including subscriptionId and optional values
     */
    updateSubscription(
        signer: any,
        params: UpdateSubscriptionParams
    ): Promise<void>;
    
    /**
     * Resumes randomness delivery for a paused subscription.
     * Only the subscription owner can reactivate their subscription.
     * 
     * @param signer - Must match the subscription's original creator
     * @param subscriptionId - ID of the subscription to reactivate
     */
    reactivateSubscription(
        signer: any,
        subscriptionId: string
    ): Promise<void>;
    
    /**
     * Calculates the fees for a given number of credits without creating a subscription.
     * Uses the runtime API's calculate_subscription_fees method.
     * 
     * @param amount - Number of random values to receive
     * @returns The calculated fee
     */
    calculateSubscriptionFees(
        amount: number
    ): Promise<number>;
    
    /**
     * Retrieves a single subscription by its ID.
     * Uses the runtime API's get_subscription method.
     * 
     * @param subscriptionId - ID of the subscription to fetch
     * @returns The subscription if found, throws error otherwise
     */
    getSubscription(subscriptionId: string): Promise<Subscription>;
    
    /**
     * Retrieves all subscriptions for a specific account.
     * Uses the runtime API's get_subscriptions_for_subscriber method.
     * 
     * @param accountId - Account ID to fetch subscriptions for
     * @returns Array of subscriptions owned by the account
     */
    getSubscriptionsForAccount(accountId: string): Promise<Subscription[]>;
}
