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

import { injectable, inject } from 'tsyringe';
import type { ISubscriptionService, UpdateSubscriptionParams } from './ISubscriptionService';
import type { IPolkadotApiService } from './IPolkadotApiService';
import type { Subscription, SubscriptionState, PulseFilter, SubscriptionDetails } from '../domain/Subscription';
import { Subscription as SubscriptionClass, SubscriptionState as SubscriptionStateEnum, PulseFilter as PulseFilterClass, SubscriptionDetails as SubscriptionDetailsClass } from '../domain/Subscription';

/**
 * XCM Location structure matching the pallet's Location type
 */
export interface XcmLocation {
    parents: number;
    interior: XcmJunctions;
}

/**
 * XCM Junctions structure - simplified for basic usage
 */
export interface XcmJunctions {
    [key: string]: any; // This can be expanded based on specific junction types needed
}

/**
 * Real implementation of the subscription service that interacts with the IDN Manager pallet
 * on the Ideal Network blockchain. This service handles both extrinsic (state-changing) 
 * operations and RPC (read-only) operations.
 * 
 * Operations are divided into two categories:
 * 1. Pallet Manager Operations (extrinsics): createSubscription, pauseSubscription, 
 *    killSubscription, updateSubscription, reactivateSubscription
 * 2. RPC API Operations (read-only): calculateSubscriptionFees, getSubscriptionsForAccount, 
 *    getSubscription
 */
@injectable()
export class IdnSubscriptionService implements ISubscriptionService {
    private subscriptionCache = new Map<string, { subscriptions: Subscription[], timestamp: number }>();
    private readonly CACHE_DURATION = 30000; // 30 seconds cache
    
    constructor(
        @inject('IPolkadotApiService') private polkadotApiService: IPolkadotApiService
    ) {}

    /**
     * Invalidates the subscription cache for a specific account or all accounts.
     */
    private invalidateCache(accountId?: string): void {
        if (accountId) {
            this.subscriptionCache.delete(accountId);
        } else {
            this.subscriptionCache.clear();
        }
    }

    /**
     * Creates a new subscription for randomness delivery.
     * Maps to the pallet's create_subscription extrinsic.
     * 
     * @param signer - The wallet/signer for the transaction
     * @param credits - Number of random values to receive (was 'amount')
     * @param target - XCM Location structure for pulse delivery
     * @param callIndex - Two-byte array [pallet_index, call_index] for XCM dispatch
     * @param frequency - Distribution interval for pulses
     * @param metadata - Optional metadata for the subscription
     */
    async createSubscription(
        signer: any,
        credits: number,
        target: XcmLocation,
        callIndex: [number, number],
        frequency: number,
        metadata?: string
    ): Promise<void> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            // Transform XCM location from UI builder format to Polkadot.js API format
            let formattedInterior;
            
            if (typeof target.interior === 'string' && (target.interior as string).toLowerCase() === 'here') {
                formattedInterior = 'Here';
            } else if (typeof target.interior === 'object' && target.interior !== null) {
                // Handle interior object like { x1: [...junctions...] }
                const interiorKey = Object.keys(target.interior)[0]; // e.g., 'x1', 'x2', etc.
                const junctions = target.interior[interiorKey];
                
                if (Array.isArray(junctions)) {
                    // Transform each junction from UI format to Polkadot.js format
                    const transformedJunctions = junctions.map((junction: any) => {
                        if (junction.type && junction.value) {
                            // Convert from { type: 'parachain', value: { parachain: 2000 } }
                            // to { Parachain: 2000 }
                            switch (junction.type.toLowerCase()) {
                                case 'parachain':
                                    return { Parachain: junction.value.parachain };
                                case 'palletinstance':
                                    return { PalletInstance: junction.value.palletInstance };
                                case 'accountid32':
                                    return { 
                                        AccountId32: {
                                            network: junction.value.network || null,
                                            id: junction.value.id
                                        }
                                    };
                                case 'accountkey20':
                                    return {
                                        AccountKey20: {
                                            network: junction.value.network || null,
                                            key: junction.value.key
                                        }
                                    };
                                case 'generalindex':
                                    return { GeneralIndex: junction.value.generalIndex };
                                case 'generalkey':
                                    return { GeneralKey: junction.value.generalKey };
                                case 'onlychild':
                                    return 'OnlyChild';
                                case 'plurality':
                                    return {
                                        Plurality: {
                                            id: junction.value.id,
                                            part: junction.value.part
                                        }
                                    };
                                default:
                                    return junction;
                            }
                        }
                        return junction;
                    });
                    
                    // Reconstruct interior with transformed junctions
                    formattedInterior = {
                        [interiorKey.charAt(0).toUpperCase() + interiorKey.slice(1)]: transformedJunctions
                    };
                } else {
                    formattedInterior = target.interior;
                }
            } else {
                formattedInterior = target.interior;
            }

            const formattedTarget = {
                parents: target.parents,
                interior: formattedInterior
            };

            // Ensure call_index is properly formatted as [u8; 2] array
            const formattedCallIndex = Array.isArray(callIndex) && callIndex.length === 2 
                ? callIndex 
                : [callIndex[0] || 0, callIndex[1] || 0];

            // Call the create_subscription extrinsic with CreateSubParams struct parameter
            // The pallet expects a single struct with exact field names from primitives.rs
            const createParams = {
                credits,
                target: formattedTarget,
                call_index: formattedCallIndex, // Ensure it's a proper [u8; 2] array
                frequency,
                metadata: metadata || null,
                sub_id: null // Use auto-generated subscription ID
            };

            let extrinsic;
            try {
                extrinsic = api.tx.idnManager.createSubscription(createParams);
            } catch (createError) {
                console.error('Error creating extrinsic:', createError);
                // Fallback: try calling with individual parameters
                extrinsic = api.tx.idnManager.createSubscription(
                    createParams.credits,
                    createParams.target,
                    createParams.call_index,
                    createParams.frequency,
                    createParams.metadata,
                    null // Use auto-generated subscription ID
                );
            }
            
            // Sign and send the transaction with optimized handling for client-side navigation
            return new Promise((resolve, reject) => {
                let resolved = false;
                
                // Use a reasonable timeout that allows for blockchain confirmation
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        reject(new Error('Transaction timeout - no confirmation received within 20 seconds'));
                    }
                }, 20000);
                
                extrinsic.signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
                    try {
                        const { status, events, dispatchError } = result;
                        
                        // Log when transaction is accepted by the network
                        if (status.isReady) {
                            console.log('Transaction submitted to the network');
                        }
                        
                        // Resolve when transaction is included in a block
                        if (status.isInBlock || status.isFinalized) {
                            clearTimeout(timeout);
                            
                            if (resolved) return; // Already resolved/rejected
                            
                            // Check for dispatch errors first
                            if (dispatchError) {
                                if (dispatchError.isModule) {
                                    const decoded = api.registry.findMetaError(dispatchError.asModule);
                                    const { docs, name, section } = decoded;
                                    console.error(`Dispatch error: ${section}.${name}: ${docs.join(' ')}`);
                                    resolved = true;
                                    reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                                } else {
                                    console.error('Dispatch error:', dispatchError.toString());
                                    resolved = true;
                                    reject(new Error(dispatchError.toString()));
                                }
                                return;
                            }
                            
                            // Check for subscription creation event
                            let subscriptionCreated = false;
                            events.forEach(({ event }: any) => {
                                if (api.events.idnManager?.SubscriptionCreated?.is(event)) {
                                    subscriptionCreated = true;
                                }
                            });
                            
                            // Invalidate cache for this account since a new subscription was created
                            this.invalidateCache(signer.address);
                            
                            // Resolve the promise to allow navigation to proceed
                            if (!resolved) {
                                resolved = true;
                                resolve();
                            }
                            
                            if (subscriptionCreated) {
                                console.log('Subscription created successfully');
                            }
                        } else if (status.isDropped || status.isInvalid || status.isUsurped) {
                            clearTimeout(timeout);
                            if (!resolved) {
                                resolved = true;
                                reject(new Error(`Transaction failed with status: ${status.type}`));
                            }
                        }
                    } catch (callbackError) {
                        clearTimeout(timeout);
                        if (!resolved) {
                            resolved = true;
                            console.error('Error in transaction callback:', callbackError);
                            reject(callbackError);
                        }
                    }
                }).catch((error: any) => {
                    clearTimeout(timeout);
                    if (!resolved) {
                        resolved = true;
                        console.error('Failed to sign and send transaction:', error);
                        reject(error);
                    }
                });
            });
            
        } catch (error) {
            console.error('Failed to create subscription:', error);
            throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Temporarily suspends randomness delivery for a subscription.
     * Maps to the pallet's pause_subscription extrinsic.
     */
    async pauseSubscription(signer: any, subscriptionId: string): Promise<void> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            const extrinsic = api.tx.idnManager.pauseSubscription(subscriptionId);
            
            // Sign and send the transaction using the same pattern as createSubscription
            return new Promise((resolve, reject) => {
                extrinsic.signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
                    const { status, events, dispatchError } = result;
                    if (status.isInBlock) {
                        // Check for dispatch errors
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(dispatchError.asModule);
                                const { docs, name, section } = decoded;
                                console.error(`Dispatch error: ${section}.${name}: ${docs.join(' ')}`);
                                reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                            } else {
                                console.error('Dispatch error:', dispatchError.toString());
                                reject(new Error(dispatchError.toString()));
                            }
                            return;
                        }
                        
                        // Look for successful subscription pause event
                        events.forEach(({ event }: any) => {
                            if (api.events.idnManager?.SubscriptionPaused?.is(event)) {
                                // Invalidate cache since subscription state changed
                                this.invalidateCache(signer.address);
                                resolve();
                            }
                        });
                        
                        // If no specific event found, still resolve after successful inclusion
                        this.invalidateCache(signer.address);
                        resolve();
                    } else if (status.isDropped || status.isInvalid || status.isUsurped) {
                        reject(new Error(`Transaction failed with status: ${status.type}`));
                    }
                }).catch((error: any) => {
                    console.error('Transaction signing/sending failed:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Failed to pause subscription:', error);
            throw new Error(`Failed to pause subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Permanently terminates a subscription.
     * Maps to the pallet's kill_subscription extrinsic.
     */
    async killSubscription(signer: any, subscriptionId: string): Promise<void> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            const extrinsic = api.tx.idnManager.killSubscription(subscriptionId);
            
            // Sign and send the transaction using the same pattern as createSubscription
            return new Promise((resolve, reject) => {
                extrinsic.signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
                    const { status, events, dispatchError } = result;
                    if (status.isInBlock) {
                        // Check for dispatch errors
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(dispatchError.asModule);
                                const { docs, name, section } = decoded;
                                console.error(`Dispatch error: ${section}.${name}: ${docs.join(' ')}`);
                                reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                            } else {
                                console.error('Dispatch error:', dispatchError.toString());
                                reject(new Error(dispatchError.toString()));
                            }
                            return;
                        }
                        
                        // Look for successful subscription kill event
                        events.forEach(({ event }: any) => {
                            if (api.events.idnManager?.SubscriptionTerminated?.is(event)) {
                                // Invalidate cache for this account to ensure UI refreshes properly
                                this.invalidateCache(signer.address);
                                resolve();
                            }
                        });
                        
                        // If no specific event found, still resolve after successful inclusion
                        // Always invalidate cache to ensure fresh data
                        this.invalidateCache(signer.address);
                        resolve();
                    } else if (status.isDropped || status.isInvalid || status.isUsurped) {
                        reject(new Error(`Transaction failed with status: ${status.type}`));
                    }
                }).catch((error: any) => {
                    console.error('Transaction signing/sending failed:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Failed to kill subscription:', error);
            throw new Error(`Failed to kill subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Updates the parameters of an existing subscription.
     * Maps to the pallet's update_subscription extrinsic.
     */
    async updateSubscription(signer: any, params: UpdateSubscriptionParams): Promise<void> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            // Prepare update parameters in the format expected by the pallet
            const updateParams = {
                sub_id: params.subscriptionId,
                credits: params.amount || null,
                frequency: params.frequency || null,
                metadata: params.metadata !== undefined ? params.metadata : null
            };

            const extrinsic = api.tx.idnManager.updateSubscription(updateParams);
            
            // Sign and send the transaction using the same pattern as createSubscription
            return new Promise((resolve, reject) => {
                extrinsic.signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
                    const { status, events, dispatchError } = result;
                    if (status.isInBlock) {
                        // Check for dispatch errors
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(dispatchError.asModule);
                                const { docs, name, section } = decoded;
                                console.error(`Dispatch error: ${section}.${name}: ${docs.join(' ')}`);
                                reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                            } else {
                                console.error('Dispatch error:', dispatchError.toString());
                                reject(new Error(dispatchError.toString()));
                            }
                            return;
                        }
                        
                        // Look for successful subscription update event
                        events.forEach(({ event }: any) => {
                            if (api.events.idnManager?.SubscriptionUpdated?.is(event)) {
                                // Invalidate cache since subscription data changed
                                this.invalidateCache(signer.address);
                                resolve();
                            }
                        });
                        
                        // If no specific event found, still resolve after successful inclusion
                        // Always invalidate cache to ensure fresh data
                        this.invalidateCache(signer.address);
                        resolve();
                    } else if (status.isDropped || status.isInvalid || status.isUsurped) {
                        reject(new Error(`Transaction failed with status: ${status.type}`));
                    }
                }).catch((error: any) => {
                    console.error('Transaction signing/sending failed:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Failed to update subscription:', error);
            throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Resumes randomness delivery for a paused subscription.
     * Maps to the pallet's reactivate_subscription extrinsic.
     */
    async reactivateSubscription(signer: any, subscriptionId: string): Promise<void> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            const extrinsic = api.tx.idnManager.reactivateSubscription(subscriptionId);
            
            // Sign and send the transaction using the same pattern as createSubscription
            return new Promise((resolve, reject) => {
                extrinsic.signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
                    const { status, events, dispatchError } = result;
                    if (status.isInBlock) {
                        // Check for dispatch errors
                        if (dispatchError) {
                            if (dispatchError.isModule) {
                                const decoded = api.registry.findMetaError(dispatchError.asModule);
                                const { docs, name, section } = decoded;
                                console.error(`Dispatch error: ${section}.${name}: ${docs.join(' ')}`);
                                reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                            } else {
                                console.error('Dispatch error:', dispatchError.toString());
                                reject(new Error(dispatchError.toString()));
                            }
                            return;
                        }
                        
                        // Look for successful subscription reactivation event
                        events.forEach(({ event }: any) => {
                            if (api.events.idnManager?.SubscriptionReactivated?.is(event)) {
                                // Invalidate cache since subscription state changed
                                this.invalidateCache(signer.address);
                                resolve();
                            }
                        });
                        
                        // If no specific event found, still resolve after successful inclusion
                        // Always invalidate cache to ensure fresh data
                        this.invalidateCache(signer.address);
                        resolve();
                    } else if (status.isDropped || status.isInvalid || status.isUsurped) {
                        reject(new Error(`Transaction failed with status: ${status.type}`));
                    }
                }).catch((error: any) => {
                    console.error('Transaction signing/sending failed:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Failed to reactivate subscription:', error);
            throw new Error(`Failed to reactivate subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Calculates the fees for a given number of credits without creating a subscription.
     * Uses the runtime API's calculate_subscription_fees method.
     */
    async calculateSubscriptionFees(amount: number): Promise<number> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            // Call the runtime API using api.call.{apiName}.{methodName}
            // Runtime APIs are called via api.call, not api.rpc
            const fees = await (api.call as any).idnManagerApi.calculateSubscriptionFees(amount);
            
            // Convert the balance to a number (assuming the balance is in planck units)
            return this.balanceToNumber(fees);
            
        } catch (error) {
            console.error('Failed to calculate subscription fees:', error);
            throw new Error(`Failed to calculate subscription fees: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves a single subscription by its ID.
     * Uses runtime API to get subscription data.
     */
    async getSubscription(subscriptionId: string): Promise<Subscription> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            let subscriptionData;
            let usedFallback = false;
            
            try {
                // Try to use the runtime API to get subscription by ID
                if ((api.rpc as any).idnManagerApi?.getSubscription) {
                    subscriptionData = await (api.rpc as any).idnManagerApi.getSubscription(subscriptionId);
                } else if (api.call && (api.call as any).idnManagerApi?.getSubscription) {
                    subscriptionData = await (api.call as any).idnManagerApi.getSubscription(subscriptionId);
                } else {
                    throw new Error('Runtime API not available');
                }
            } catch (runtimeError) {
                console.log('Runtime API failed, using storage fallback:', runtimeError);
                usedFallback = true;
                
                // Fallback to storage query if runtime API fails
                const storageSubscription = await this.getSubscriptionViaStorage(subscriptionId);
                if (storageSubscription) {
                    return storageSubscription;
                } else {
                    throw new Error(`Subscription with ID ${subscriptionId} not found in storage`);
                }
            }
            
            if (!subscriptionData || subscriptionData.isEmpty) {
                if (!usedFallback) {
                    // Try storage fallback if runtime API returned empty
                    const storageSubscription = await this.getSubscriptionViaStorage(subscriptionId);
                    if (storageSubscription) {
                        return storageSubscription;
                    }
                }
                throw new Error(`Subscription with ID ${subscriptionId} not found`);
            }
            
            // Convert pallet subscription to domain model
            const subscription = this.palletSubscriptionToSubscription(subscriptionData);
            
            return subscription;
            
        } catch (error) {
            console.error('Failed to get subscription:', error);
            throw new Error(`Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Retrieves all subscriptions for a specific account.
     * Uses the runtime API's get_subscriptions_for_subscriber method.
     */
    async getSubscriptionsForAccount(accountId: string): Promise<Subscription[]> {
        try {
            // Check cache first
            const cached = this.subscriptionCache.get(accountId);
            if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
                console.log(`Using cached subscriptions for account ${accountId}`);
                return cached.subscriptions;
            }
            
            const api = await this.polkadotApiService.getApi();
            
            let result;
            // Try to use the runtime API getSubscriptionsForSubscriber method
            if ((api.rpc as any).idnManagerApi?.getSubscriptionsForSubscriber) {
                result = await (api.rpc as any).idnManagerApi.getSubscriptionsForSubscriber(accountId);
            } else if (api.call && (api.call as any).idnManagerApi?.getSubscriptionsForSubscriber) {
                result = await (api.call as any).idnManagerApi.getSubscriptionsForSubscriber(accountId);
            } else {
                // Fallback to storage query if runtime API not available
                const subscriptions = await this.getSubscriptionsViaStorage(accountId);
                // Cache the result to avoid repeated expensive storage queries
                this.subscriptionCache.set(accountId, {
                    subscriptions,
                    timestamp: Date.now()
                });
                return subscriptions;
            }
            
            if (!result || result.length === 0) {
                // Cache empty result too
                this.subscriptionCache.set(accountId, {
                    subscriptions: [],
                    timestamp: Date.now()
                });
                return [];
            }
            
            // Convert pallet subscriptions to domain model
            const subscriptions = result.map((palletSub: any) => {
                return this.palletSubscriptionToSubscription(palletSub);
            });
            
            // Cache the result
            this.subscriptionCache.set(accountId, {
                subscriptions,
                timestamp: Date.now()
            });
            
            return subscriptions;
            
        } catch (error) {
            console.error('Failed to get subscriptions for account:', error);
            // Return empty array instead of throwing to prevent UI crashes
            return [];
        }
    }

    /**
     * Optimized fallback method to get subscriptions via storage queries when runtime API is not available.
     * This method now attempts more efficient queries before falling back to the expensive full scan.
     */
    private async getSubscriptionsViaStorage(accountId: string): Promise<Subscription[]> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            console.log('Runtime API not available, using storage fallback for account:', accountId);
            
            // First, try to find if there's an index or more efficient way to query
            // If the pallet stores subscriber->subscription mappings, we could use those
            // For now, we'll limit the scope and add early returns for better performance
            
            const subscriptions: Subscription[] = [];
            const maxSubscriptionsToScan = 1000; // Limit scan scope for performance
            let scannedCount = 0;
            
            // Query all subscription entries from storage
            const entries = await api.query.idnManager.subscriptions.entries();
            
            console.log(`Scanning ${Math.min(entries.length, maxSubscriptionsToScan)} subscriptions for account ${accountId}`);
            
            for (const [key, value] of entries) {
                // Performance protection: don't scan indefinitely
                if (scannedCount >= maxSubscriptionsToScan) {
                    console.warn(`Reached scan limit of ${maxSubscriptionsToScan} subscriptions. Some subscriptions may not be loaded.`);
                    break;
                }
                scannedCount++;
                
                try {
                    if (value && !value.isEmpty) {
                        const rawData = value.toJSON();
                        
                        // Quick check: look for account ID in raw data before expensive conversion
                        const rawString = JSON.stringify(rawData);
                        if (!rawString.includes(accountId)) {
                            continue; // Skip expensive conversion if account not found in raw data
                        }
                        
                        // Check if this subscription belongs to the requested account
                        const subscription = this.palletSubscriptionToSubscription(rawData);
                        
                        // Filter by account if the subscription has subscriber info
                        if (subscription.details.subscriber === accountId) {
                            subscriptions.push(subscription);
                        }
                    }
                } catch (conversionError) {
                    console.error('Error converting subscription:', conversionError);
                    // Continue processing other subscriptions
                }
            }
            
            console.log(`Found ${subscriptions.length} subscriptions for account ${accountId} after scanning ${scannedCount} entries`);
            return subscriptions;
            
        } catch (error) {
            console.error('Storage fallback also failed:', error);
            return [];
        }
    }

    /**
     * Fallback method to get a single subscription by ID via storage query when runtime API is not available.
     */
    private async getSubscriptionViaStorage(subscriptionId: string): Promise<Subscription | null> {
        try {
            const api = await this.polkadotApiService.getApi();
            
            console.log(`Using storage fallback for subscription ${subscriptionId}`);
            
            // Try to query the specific subscription directly by ID
            try {
                const subscriptionData = await api.query.idnManager.subscriptions(subscriptionId);
                
                if (subscriptionData && !subscriptionData.isEmpty) {
                    const rawData = subscriptionData.toJSON();
                    return this.palletSubscriptionToSubscription(rawData);
                }
            } catch (directQueryError) {
                console.log('Direct storage query failed, scanning all subscriptions:', directQueryError);
            }
            
            // Fallback to scanning all subscriptions if direct query fails
            const entries = await api.query.idnManager.subscriptions.entries();
            const maxSubscriptionsToScan = 1000; // Limit scan scope for performance
            let scannedCount = 0;
            
            console.log(`Scanning ${Math.min(entries.length, maxSubscriptionsToScan)} subscriptions for ID ${subscriptionId}`);
            
            for (const [key, value] of entries) {
                // Performance protection: don't scan indefinitely
                if (scannedCount >= maxSubscriptionsToScan) {
                    console.warn(`Reached scan limit of ${maxSubscriptionsToScan} subscriptions.`);
                    break;
                }
                scannedCount++;
                
                try {
                    if (value && !value.isEmpty) {
                        const rawData = value.toJSON();
                        const subscription = this.palletSubscriptionToSubscription(rawData);
                        
                        // Check if this is the subscription we're looking for
                        if (subscription.id === subscriptionId) {
                            console.log(`Found subscription ${subscriptionId} after scanning ${scannedCount} entries`);
                            return subscription;
                        }
                    }
                } catch (conversionError) {
                    console.error('Error converting subscription during ID lookup:', conversionError);
                    // Continue processing other subscriptions
                }
            }
            
            console.log(`Subscription ${subscriptionId} not found after scanning ${scannedCount} entries`);
            return null;
            
        } catch (error) {
            console.error('Storage fallback for single subscription also failed:', error);
            return null;
        }
    }

    /**
     * Retrieves all subscriptions in the system.
     * Currently not implemented as there's no way to get all subscriptions from the ideal network chain.
     */
    async getAllSubscriptions(): Promise<Subscription[]> {
        // As specified in the requirements, this method is not implemented
        // because there's no way to get all subscriptions from the ideal network chain
        console.warn('getAllSubscriptions is not implemented - no chain API available');
        return [];
    }



    /**
     * Extracts metadata string from various formats (hex, bytes, string, etc.)
     */
    private extractMetadataString(metadata: any): string {
        if (!metadata) return '';
        
        // If it's already a string
        if (typeof metadata === 'string') {
            // Check if it's hex-encoded
            if (metadata.startsWith('0x')) {
                try {
                    const hex = metadata.slice(2);
                    let decoded = '';
                    for (let i = 0; i < hex.length; i += 2) {
                        const byte = parseInt(hex.substr(i, 2), 16);
                        if (byte > 0) { // Skip null bytes
                            decoded += String.fromCharCode(byte);
                        }
                    }
                    // Filter out non-printable characters
                    const clean = decoded.replace(/[\x00-\x1F\x7F]/g, '');
                    return clean || metadata;
                } catch (error) {
                    console.warn('Failed to decode hex metadata:', error);
                    return metadata;
                }
            }
            return metadata;
        }
        
        // If it's a Polkadot.js Codec type
        if (metadata && typeof metadata.toString === 'function') {
            const str = metadata.toString();
            return this.extractMetadataString(str); // Recursively handle the string
        }
        
        // If it's an array (Vec<u8>)
        if (Array.isArray(metadata)) {
            try {
                const decoded = metadata.map(byte => String.fromCharCode(Number(byte))).join('');
                const clean = decoded.replace(/[\x00-\x1F\x7F]/g, '');
                return clean;
            } catch (error) {
                console.warn('Failed to decode array metadata:', error);
                return metadata.toString();
            }
        }
        
        // Default fallback
        return metadata.toString();
    }
    
    /**
     * Converts a pallet subscription to our domain Subscription model
     */
    private palletSubscriptionToSubscription(palletSub: any): Subscription {
        // Defensive programming - handle different possible structures
        if (!palletSub) {
            throw new Error('Pallet subscription data is null or undefined');
        }
        
        // Based on actual blockchain data structure:
        // Root level: id, creditsLeft, state, createdAt, updatedAt, credits, frequency, metadata, lastDelivered
        // Nested under details: subscriber, target, callIndex
        const details = palletSub.details;
        
        if (!details) {
            throw new Error('Subscription details not found in pallet data');
        }
        
        const subscriptionDetails = new SubscriptionDetailsClass(
            details.subscriber ? details.subscriber.toString() : 'unknown',
            palletSub.createdAt ? Number(palletSub.createdAt) : Date.now(),
            palletSub.updatedAt ? Number(palletSub.updatedAt) : Date.now(),
            palletSub.credits ? Number(palletSub.credits) : 0, // amount is at root level as 'credits'
            palletSub.frequency ? Number(palletSub.frequency) : 1, // frequency is at root level
            details.target ? JSON.stringify(details.target) : '', // serialize the target object
            this.extractMetadataString(palletSub.metadata), // metadata is at root level
            details.callIndex ? details.callIndex.toString() : '', // callIndex is in details
            0, // deposit - not present in this structure
            undefined // pulseFilter - not present in this structure
        );

        return new SubscriptionClass(
            palletSub.id ? palletSub.id.toString() : 'unknown',
            subscriptionDetails,
            palletSub.creditsLeft ? Number(palletSub.creditsLeft) : 0,
            palletSub.state ? this.palletStateToSubscriptionState(palletSub.state) : SubscriptionStateEnum.Active,
            // Calculate creditsConsumed from credits - creditsLeft
            palletSub.credits && palletSub.creditsLeft ? 
                Number(palletSub.credits) - Number(palletSub.creditsLeft) : 0,
            0 // feesPaid - not present in this structure
        );
    }

    /**
     * Converts pallet subscription state to our domain SubscriptionState
     */
    private palletStateToSubscriptionState(palletState: any): SubscriptionState {
        // Map pallet state enum to our domain state enum
        if (palletState.isActive || palletState === 'Active') {
            return SubscriptionStateEnum.Active;
        } else if (palletState.isPaused || palletState === 'Paused') {
            return SubscriptionStateEnum.Paused;
        } else {
            return SubscriptionStateEnum.Active; // Default fallback
        }
    }

    /**
     * Converts pallet pulse filter to our domain PulseFilter
     */
    private palletPulseFilterToPulseFilter(palletFilter: any): PulseFilter {
        return new PulseFilterClass(
            palletFilter.round ? Number(palletFilter.round) : undefined,
            palletFilter.hashPrefix ? palletFilter.hashPrefix.toString() : undefined,
            palletFilter.customExpression ? palletFilter.customExpression.toString() : undefined
        );
    }

    /**
     * Converts blockchain balance type to number
     */
    private balanceToNumber(balance: any): number {
        if (typeof balance === 'number') {
            return balance;
        }
        if (balance && typeof balance.toNumber === 'function') {
            return balance.toNumber();
        }
        if (balance && typeof balance.toString === 'function') {
            return Number(balance.toString());
        }
        return 0;
    }
}