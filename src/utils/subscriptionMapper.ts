import { Subscription, SubscriptionState } from '@/domain/Subscription';
import type { UiSubscription } from '@/app/subscriptions/types/UiSubscription';

/**
 * Converts a domain subscription model to the UI subscription model
 */
export function domainToUiSubscription(sub: Subscription): UiSubscription {
  // Parse parachain ID from target string
  const parachainId = extractParachainId(sub.details.target);
  
  // Convert timestamp to date string
  const createdAt = new Date(sub.details.createdAt).toISOString().split('T')[0];
  
  // Calculate usage history (this would ideally come from transaction history)
  const usageHistory = generateMockUsageHistory(sub.creditsConsumed);
  
  return {
    id: sub.id,
    name: sub.details.metadata || `Subscription ${sub.id.slice(0, 8)}`,
    parachainId,
    duration: sub.details.amount,
    frequency: sub.details.frequency,
    xcmLocation: sub.details.target,
    status: mapStateToStatus(sub.state),
    remainingAmount: sub.creditsLeft,
    // This would come from a randomness delivery event in a real implementation
    lastRandomValue: sub.state === SubscriptionState.Active ? 
      generateMockRandomValue() : undefined,
    createdAt,
    usageHistory
  };
}

/**
 * Extract parachain ID from an XCM target string
 */
function extractParachainId(target: string): number {
  const match = target.match(/para\((\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
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
 * Generate a mock random value hash for display purposes
 */
function generateMockRandomValue(): string {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate mock usage history based on credits consumed
 */
function generateMockUsageHistory(creditsConsumed: number): Array<{
  date: string;
  blocks: number;
  tokens: number;
}> {
  // Create up to 5 history items based on consumed credits
  const count = Math.min(5, creditsConsumed);
  if (count <= 0) return [];
  
  return Array.from({ length: count }, (_, i) => {
    // Generate dates from newest to oldest
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Mock block numbers in descending order
    const blockBase = 15250000;
    const blockNumber = blockBase - (i * 100);
    
    // Each usage consumes 1 token in this mock implementation
    return {
      date: date.toISOString().split('T')[0],
      blocks: blockNumber,
      tokens: 1
    };
  });
}
