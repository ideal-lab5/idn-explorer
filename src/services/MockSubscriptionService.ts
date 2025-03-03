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

import { ISubscriptionService } from './ISubscriptionService';
import { Subscription, SubscriptionState, SubscriptionDetails } from '../domain/Subscription';

/**
 * Mock implementation of the subscription service.
 * This class provides a working implementation that stores subscriptions in memory,
 * useful for testing and development before integrating with the actual blockchain.
 * 
 * The implementation mirrors the behavior of the idn-manager pallet:
 * - Maintains subscription state
 * - Enforces ownership checks
 * - Manages subscription lifecycle
 */
export class MockSubscriptionService implements ISubscriptionService {
    /** In-memory storage of subscriptions, keyed by subscription ID */
    private subscriptions: Map<string, Subscription> = new Map();

    /**
     * Creates a new subscription with the given parameters.
     * 
     * @param signer The signer of the subscription.
     * @param amount The amount of the subscription.
     * @param target The target of the subscription.
     * @param frequency The frequency of the subscription.
     * @param metadata Optional metadata for the subscription.
     */
    async createSubscription(
        signer: any,
        amount: number,
        target: string,
        frequency: number,
        metadata?: string
    ): Promise<void> {
        const subscription = Subscription.create(
            signer.address,
            amount,
            target,
            frequency,
            metadata
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
     * @param subscriptionId The ID of the subscription to update.
     * @param amount The new amount of the subscription.
     * @param frequency The new frequency of the subscription.
     */
    async updateSubscription(
        signer: any,
        subscriptionId: string,
        amount: number,
        frequency: number
    ): Promise<void> {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) throw new Error('Subscription not found');
        if (subscription.details.subscriber !== signer.address) throw new Error('Unauthorized');
        
        subscription.details.amount = amount;
        subscription.details.frequency = frequency;
        subscription.details.updatedAt = Date.now();
        this.subscriptions.set(subscriptionId, subscription);
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
     * Retrieves all subscriptions.
     */
    async getAllSubscriptions(): Promise<Subscription[]> {
        return Array.from(this.subscriptions.values());
    }
}
