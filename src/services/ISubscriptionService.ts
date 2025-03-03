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

import { Subscription, SubscriptionDetails } from '../domain/Subscription';

/**
 * Defines the interface for interacting with subscription data.
 * This service abstracts the underlying subscription management,
 * whether it's using mock data or actual blockchain interactions.
 * 
 * All methods that modify subscription state require a signer to
 * ensure proper authorization, mirroring the blockchain's permission model.
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
     */
    createSubscription(
        signer: any, 
        amount: number,
        target: string,
        frequency: number,
        metadata?: string
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
     * 
     * @param signer - Must match the subscription's original creator
     * @param subscriptionId - ID of the subscription to update
     * @param amount - New total number of random values
     * @param frequency - New delivery frequency
     */
    updateSubscription(
        signer: any,
        subscriptionId: string,
        amount: number,
        frequency: number
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
     * Retrieves a single subscription by its ID.
     * 
     * @param subscriptionId - ID of the subscription to fetch
     * @returns The subscription if found, throws error otherwise
     */
    getSubscription(subscriptionId: string): Promise<Subscription>;
    
    /**
     * Retrieves all active subscriptions in the system.
     * 
     * @returns Array of all subscriptions
     */
    getAllSubscriptions(): Promise<Subscription[]>;
}
