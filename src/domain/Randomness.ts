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

/**
 * This is the Randomness domain class. It is used to represent a generated random value
 * ingested from the randomness-beacon pallet.
 */
export class Randomness {
  /** Block number where the randomness was ingested */
  block: number;
  /** The aggregated signature (randomness value) */
  randomness: string;
  /** Legacy field - kept for backward compatibility */
  signature: string;
  /** First round number in the aggregation */
  startRound: number;
  /** Last round number in the aggregation */
  endRound: number;
  /** Timestamp when this entry was recorded */
  timestamp: number;
  /** Status of the randomness entry */
  status: string = 'Generated';

  constructor(
    block: number,
    randomness: string,
    signature: string,
    startRound: number = 0,
    endRound: number = 0,
    timestamp: number = Date.now()
  ) {
    this.block = block;
    this.randomness = randomness;
    this.signature = signature;
    this.startRound = startRound;
    this.endRound = endRound;
    this.timestamp = timestamp;
  }

  /**
   * Create a Randomness instance from cached data
   */
  static fromCache(data: any): Randomness {
    return new Randomness(
      data.block,
      data.randomness,
      data.signature || data.randomness,
      data.startRound || 0,
      data.endRound || 0,
      data.timestamp || Date.now()
    );
  }

  /**
   * Convert to a plain object for caching
   */
  toCache(): object {
    return {
      block: this.block,
      randomness: this.randomness,
      signature: this.signature,
      startRound: this.startRound,
      endRound: this.endRound,
      timestamp: this.timestamp,
    };
  }
}
