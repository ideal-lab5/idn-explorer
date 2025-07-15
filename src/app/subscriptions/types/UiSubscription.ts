/**
 * UI representation of a subscription
 * This interface is used for UI display purposes only and is separate from the domain model
 */
export interface UiSubscription {
  id: string;
  name: string;
  parachainId: number;
  totalCredits: number; // Total credits purchased
  creditsRemaining: number; // Credits remaining
  creditsConsumed: number; // Credits already consumed
  frequency: number;
  xcmLocation: string;
  rawTarget?: any; // Raw XCM location data for sophisticated viewing
  status: string;
  callIndex: { pallet: number; call: number }; // Parsed call index
  usageHistory: Array<{
    blocks: number;
    credits: number; // Changed from tokens to credits
  }>;
}
