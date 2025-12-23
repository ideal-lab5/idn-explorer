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

import type { SubscriptionType, UiSubscription } from '@/app/subscriptions/types/UiSubscription';
import { Subscription, SubscriptionState } from '@/domain/Subscription';
import { decodeCallData, isContractCall } from './callDataEncoder';

/**
 * Converts a domain subscription model to the UI subscription model.
 * Maps fields from the pallet-aligned domain model to the UI display format.
 */
export function domainToUiSubscription(sub: Subscription): UiSubscription {
  // Parse parachain ID from target (handles both string and object formats)
  const parachainId = extractParachainId(sub.details.target);

  // Decode call data to determine subscription type and extract details
  const callData = sub.details.call || '';
  const decodedCall = decodeCallData(callData);
  const subscriptionType: SubscriptionType = decodedCall.type;

  // Format XCM location for display
  const formattedXcmLocation = formatXcmLocation(sub.details.target);

  // Calculate usage history (this would ideally come from transaction history)
  const usageHistory = generateMockUsageHistory(sub.creditsConsumed);

  // Build the UI subscription object
  const uiSubscription: UiSubscription = {
    id: sub.id,
    name: decodeMetadata(sub.metadata) || `Randomness Subscription`,
    parachainId,
    totalCredits: sub.credits,
    creditsRemaining: sub.creditsLeft,
    creditsConsumed: sub.creditsConsumed,
    frequency: sub.frequency,
    xcmLocation: formattedXcmLocation,
    rawTarget: sub.details.target,
    status: mapStateToStatus(sub.state),
    subscriptionType,
    callIndex: {
      pallet: decodedCall.palletIndex,
      call: decodedCall.callIndex,
    },
    usageHistory,
  };

  // Add contract-specific fields if this is a contract subscription
  if (decodedCall.type === 'contract') {
    uiSubscription.contractAddress = decodedCall.contractAddress;
    uiSubscription.contractSelector = decodedCall.selector;
    uiSubscription.gasLimit = decodedCall.gasLimit;
    uiSubscription.storageDepositLimit = decodedCall.storageDepositLimit;
    uiSubscription.contractValue = decodedCall.value;
  }

  return uiSubscription;
}

/**
 * Decode metadata from subscription
 * Handles both string metadata and potentially hex-encoded bytes
 */
function decodeMetadata(metadata: string | null | undefined): string {
  if (!metadata) return '';

  // If it's already a readable string, return it
  if (!metadata.startsWith('0x') && !/^[0-9a-fA-F]+$/.test(metadata)) {
    return metadata;
  }

  try {
    // Handle hex-encoded strings
    if (metadata.startsWith('0x')) {
      const hex = metadata.slice(2);
      // Convert hex to string (browser-compatible)
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.substr(i, 2), 16);
        if (byte > 0) {
          // Skip null bytes
          decoded += String.fromCharCode(byte);
        }
      }
      // Filter out non-printable characters
      return decoded.replace(/[\x00-\x1F\x7F]/g, '') || metadata;
    }

    // Handle potential byte arrays or other encoded formats
    // For now, return the original metadata if we can't decode it
    return metadata;
  } catch (error) {
    console.warn('Failed to decode metadata:', metadata, error);
    return metadata;
  }
}

/**
 * Extract parachain ID from XCM target (can be string or object)
 */
function extractParachainId(target: string | any): number {
  // Handle JSON object from blockchain storage
  if (typeof target === 'object' && target !== null) {
    // Parse the target object: { parents: 1, interior: { x1: [{ parachain: 2000 }] } }
    if (target.interior && target.interior.x1 && Array.isArray(target.interior.x1)) {
      const parachain = target.interior.x1.find(
        (junction: any) => junction.parachain !== undefined
      );
      if (parachain) {
        return parachain.parachain;
      }
    }
    // Also check for X1 format with Parachain directly
    if (target.interior?.X1?.Parachain) {
      return target.interior.X1.Parachain;
    }
    // Check for array format: X1: [{ Parachain: 2000 }]
    if (target.interior?.X1 && Array.isArray(target.interior.X1)) {
      const parachain = target.interior.X1.find((j: any) => j.Parachain !== undefined);
      if (parachain) {
        // Handle formatted numbers like "2,000"
        const val = parachain.Parachain;
        return typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val;
      }
    }
    return 0;
  }

  // Handle JSON string
  if (typeof target === 'string') {
    try {
      const parsed = JSON.parse(target);
      return extractParachainId(parsed); // Recursively handle parsed object
    } catch {
      // Handle legacy string format like "para(2000)"
      const match = target.match(/para\((\d+)\)/);
      return match ? parseInt(match[1], 10) : 0;
    }
  }

  return 0;
}

/**
 * Format XCM location for display
 */
function formatXcmLocation(target: string | any): string {
  if (typeof target === 'object' && target !== null) {
    const parachainId = extractParachainId(target);
    if (parachainId > 0) {
      return `Parachain ${parachainId} (Parents: ${target.parents || 0})`;
    }
    return `XCM Location (Parents: ${target.parents || 0})`;
  }

  if (typeof target === 'string') {
    try {
      const parsed = JSON.parse(target);
      return formatXcmLocation(parsed);
    } catch {
      return target; // Return original string if can't parse
    }
  }

  return 'Unknown Target';
}

/**
 * Map domain subscription state to UI status string
 */
function mapStateToStatus(state: SubscriptionState): string {
  switch (state) {
    case SubscriptionState.Active:
      return 'active';
    case SubscriptionState.Paused:
      return 'paused';
    case SubscriptionState.Finalized:
      return 'finalized';
    default:
      return 'unknown';
  }
}

/**
 * Generate mock usage history based on credits consumed
 */
function generateMockUsageHistory(creditsConsumed: number): Array<{
  blocks: number;
  credits: number;
}> {
  // Create up to 5 history items based on consumed credits
  const count = Math.min(5, creditsConsumed);
  if (count <= 0) return [];

  return Array.from({ length: count }, (_, i) => {
    // Mock block numbers in descending order
    const blockBase = 15250000;
    const blockNumber = blockBase - i * 100;

    // Each usage consumes 1 credit in this mock implementation
    return {
      blocks: blockNumber,
      credits: 1,
    };
  });
}
