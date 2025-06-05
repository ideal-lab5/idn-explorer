/**
 * UI representation of a subscription
 * This interface is used for UI display purposes only and is separate from the domain model
 */
export interface UiSubscription {
  id: string;
  name: string;
  parachainId: number;
  duration: number;
  frequency: number;
  xcmLocation: string;
  status: string;
  remainingAmount: number;
  lastRandomValue?: string;
  createdAt: string;
  usageHistory: Array<{
    date: string;
    blocks: number;
    tokens: number;
  }>;
}
