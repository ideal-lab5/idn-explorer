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

import { ISubscriptionService, UpdateSubscriptionParams } from './ISubscriptionService';
import { Subscription, SubscriptionState, SubscriptionDetails, PulseFilter } from '../domain/Subscription';

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
     * @param pulseFilter Optional filter for which pulses to receive
     */
    async createSubscription(
        signer: any,
        amount: number,
        target: string,
        frequency: number,
        metadata?: string,
        pulseFilter?: PulseFilter
    ): Promise<void> {
        // Calculate a mock deposit based on the parameters
        const deposit = this.calculateStorageDeposit(amount, target, metadata, pulseFilter);
        
        const subscription = Subscription.create(
            signer.address,
            amount,
            target,
            frequency,
            metadata,
            pulseFilter,
            deposit
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
    async updateSubscription(
        signer: any,
        params: UpdateSubscriptionParams
    ): Promise<void> {
        const subscription = this.subscriptions.get(params.subscriptionId);
        if (!subscription) throw new Error('Subscription not found');
        if (subscription.details.subscriber !== signer.address) throw new Error('Unauthorized');
        
        // Update only the provided parameters
        if (params.amount !== undefined) {
            subscription.details.amount = params.amount;
            // Update credits left if amount increased
            const addedCredits = params.amount - (subscription.creditsLeft + subscription.creditsConsumed);
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
        
        if (params.pulseFilter !== undefined) {
            subscription.details.pulseFilter = params.pulseFilter;
        }
        
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
        const baseRate = 0.01;  // Mock base rate per unit
        return amount * baseRate;
    }
    

    
    // getSubscriptionInfo method has been removed - using runtime API's get_subscription instead
    
    /**
     * Retrieves all subscriptions for a specific account.
     * 
     * @param accountId Account ID to fetch subscriptions for
     * @returns Array of subscriptions owned by the account
     */
    async getSubscriptionsForAccount(accountId: string): Promise<Subscription[]> {
        return Array.from(this.subscriptions.values())
            .filter(sub => sub.details.subscriber === accountId);
    }
    
    /**
     * Calculates a mock storage deposit based on subscription parameters.
     * This would be replaced with actual blockchain-based calculation in a real implementation.
     * 
     * @param amount Number of random values
     * @param target XCM target location
     * @param metadata Optional metadata string
     * @param pulseFilter Optional pulse filter
     * @returns The calculated storage deposit amount
     */
    private calculateStorageDeposit(
        amount: number,
        target: string,
        metadata?: string,
        pulseFilter?: PulseFilter
    ): number {
        // Base deposit
        let deposit = 1.0;
        
        // Add for target complexity (simple mock calculation)
        deposit += target.length * 0.01;
        
        // Add for metadata if present
        if (metadata) {
            deposit += metadata.length * 0.005;
        }
        
        // Add for pulse filter if present
        if (pulseFilter) {
            deposit += 0.5;
        }
        
        return deposit;
    }
}
