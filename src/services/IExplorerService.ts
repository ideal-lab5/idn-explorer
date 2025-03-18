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

import { DelayedTransaction } from "@/domain/DelayedTransaction";
import { DelayedTransactionDetails } from "@/domain/DelayedTransactionDetails";
import { ExecutedTransaction } from "@/domain/ExecutedTransaction";
import { Randomness } from "@/domain/Randomness";

export interface IExplorerService {
    initializeTlock: () => Promise<any>;
    getRandomness: (blockNumber: number, size: number) => Promise<Randomness[]>;
    getScheduledTransactions: () => Promise<DelayedTransaction[]>;
    queryHistoricalEvents: (startBlock: number, endBlock: number) => Promise<ExecutedTransaction[]>;
    scheduleTransaction: (signer: any, transactionDetails: DelayedTransactionDetails) => Promise<void>;
    getFreeBalance: (signer: any) => Promise<string>;
    cancelTransaction: (signer: any, blockNumber: number, index: number) => Promise<void>;
}
