import { DelayedTransaction } from "@/domain/DelayedTransaction";
import { DelayedTransactionDetails } from "@/domain/DelayedTransactionDetails";
import { ExecutedTransaction } from "@/domain/ExecutedTransaction";
import { Randomness } from "@/domain/Randomness";

export interface IExplorerService {
    getEtfApi: () => Promise<any>;
    getRandomness: (blockNumber: number, size: number) => Promise<Randomness[]>;
    getScheduledTransactions: () => Promise<DelayedTransaction[]>;
    queryHistoricalEvents: (startBlock: number, endBlock: number) => Promise<ExecutedTransaction[]>;
    scheduleTransaction: (signer: any, transactionDetails: DelayedTransactionDetails) => Promise<void>;
    getFreeBalance: (signer: any) => Promise<string>;
    cancelTransaction: (signer: any, blockNumber: number, index: number) => Promise<void>;
}
