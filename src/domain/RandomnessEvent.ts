// Copyright 2023-2024 Ideal Labs.
// SPDX-License-Identifier: Apache-2.0

/**
 * Represents a randomness distribution event from the Ideal Network blockchain
 */
export class RandomnessDistributionEvent {
  /**
   * @param id Unique identifier for the event (usually block number + event index)
   * @param blockNumber Block number where the event occurred
   * @param timestamp Timestamp of the block (if available)
   * @param subscriptionId ID of the subscription that received randomness
   * @param randomValue The random value that was distributed (hex string)
   * @param target The target location (XCM) where randomness was sent
   * @param callIndex The call index used for randomness delivery
   */
  constructor(
    public readonly id: string,
    public readonly blockNumber: number,
    public readonly timestamp: Date | null,
    public readonly subscriptionId: string,
    public readonly randomValue: string,
    public readonly target: any,
    public readonly callIndex: string
  ) {}

  /**
   * Factory method to create a RandomnessDistributionEvent from blockchain event data
   * @param blockNumber Block number where the event occurred
   * @param eventIdx Index of the event in the block
   * @param eventData Event data from the blockchain
   * @param timestamp Optional timestamp
   */
  static fromEventData(
    blockNumber: number,
    eventIdx: number,
    eventData: any,
    timestamp?: Date
  ): RandomnessDistributionEvent {
    // Create a unique ID from block number and event index
    const id = `${blockNumber}-${eventIdx}`;

    // Extract data from the randomness distribution event
    const subscriptionId = eventData.subscriptionId?.toString() || eventData[0]?.toString() || '';
    const randomValue = eventData.randomValue?.toString() || eventData[1]?.toString() || '';

    // Extract target and call index if available in the event data
    // Note: actual structure depends on the chain event format
    const target = eventData.target || eventData[2] || null;
    const callIndex = eventData.callIndex?.toString() || eventData[3]?.toString() || '';

    return new RandomnessDistributionEvent(
      id,
      blockNumber,
      timestamp || null,
      subscriptionId,
      randomValue,
      target,
      callIndex
    );
  }
}
