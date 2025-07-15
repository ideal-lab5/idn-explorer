import { Subscription, SubscriptionState } from '@/domain/Subscription';
import type { UiSubscription } from '@/app/subscriptions/types/UiSubscription';

/**
 * Converts a domain subscription model to the UI subscription model
 */
export function domainToUiSubscription(sub: Subscription): UiSubscription {
  // Parse parachain ID from target (handles both string and object formats)
  const parachainId = extractParachainId(sub.details.target);
  
  // Parse call index to get pallet and call indices
  const callIndex = parseCallIndex(sub.details.callIndex || '');
  
  // Format XCM location for display
  const formattedXcmLocation = formatXcmLocation(sub.details.target);
  
  // Calculate usage history (this would ideally come from transaction history)
  const usageHistory = generateMockUsageHistory(sub.creditsConsumed);
  
  return {
    id: sub.id,
    name: decodeMetadata(sub.details.metadata) || `Randomness Subscription`,
    parachainId,
    totalCredits: sub.details.amount,        // Total credits purchased
    creditsRemaining: sub.creditsLeft,       // Credits remaining
    creditsConsumed: sub.creditsConsumed,    // Credits already consumed
    frequency: sub.details.frequency,
    xcmLocation: formattedXcmLocation,       // Formatted for display
    rawTarget: sub.details.target,           // Raw XCM location data for sophisticated viewing
    status: mapStateToStatus(sub.state),
    // Add call index information for display
    callIndex: callIndex,
    usageHistory
  };
}

/**
 * Decode metadata from subscription
 * Handles both string metadata and potentially hex-encoded bytes
 */
function decodeMetadata(metadata: string | undefined): string {
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
        if (byte > 0) { // Skip null bytes
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
      const parachain = target.interior.x1.find((junction: any) => junction.parachain !== undefined);
      if (parachain) {
        return parachain.parachain;
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
 * Parse call index from hex string (e.g., "0x2a03" -> { pallet: 42, call: 3 })
 */
function parseCallIndex(callIndex: string): { pallet: number; call: number } {
  if (!callIndex || !callIndex.startsWith('0x')) {
    return { pallet: 0, call: 0 };
  }
  
  const hex = callIndex.slice(2); // Remove '0x'
  if (hex.length !== 4) { // Should be 4 hex chars for 2 bytes
    return { pallet: 0, call: 0 };
  }
  
  const pallet = parseInt(hex.slice(0, 2), 16); // First byte
  const call = parseInt(hex.slice(2, 4), 16);   // Second byte
  
  return { pallet, call };
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
    const blockNumber = blockBase - (i * 100);
    
    // Each usage consumes 1 credit in this mock implementation
    return {
      blocks: blockNumber,
      credits: 1
    };
  });
}
