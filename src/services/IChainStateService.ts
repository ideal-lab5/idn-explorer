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

export interface SessionInfo {
  sessionProgress: number;
  sessionLength: number;
  eraProgress: number;
  sessionsPerEra: number;
}

export interface BlockHeader {
    blockNumber: number;
    blockHash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
}

export interface IChainStateService {
  getBalance(address: string): Promise<string>;
  subscribeToBlocks(callback: (blockNumber: number) => void): Promise<() => void>;
  getSessionInfo(): Promise<SessionInfo>;
  getSessionIndex(): Promise<number>;
  subscribeToBalanceChanges(address: string, callback: (balance: string) => void): Promise<() => void>;
  subscribeToNewHeaders(callback: (header: BlockHeader) => void): Promise<() => void>;
  getPallets(): Promise<{ text: string; value: string; }[]>;
  getExtrinsics(pallet: string): Promise<string[]>;
  getExtrinsicParameters(pallet: string, extrinsic: string): Promise<{ name: string; type: string; typeName: string; }[]>;
}
