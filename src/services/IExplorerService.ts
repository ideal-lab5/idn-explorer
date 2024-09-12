import { DelayedTransaction } from "@/domain/DelayedTransaction";
import { ExecutedTransaction } from "@/domain/ExecutedTransaction";
import { Randomness } from "@/domain/Randomness";

export interface IExplorerService {
    getEtfApi: () => Promise<any>;
    getRandomness: (blockNumber: number, size: number) => Promise<Randomness[]>;
    getScheduledTransactions: () => Promise<DelayedTransaction[]>;
    queryHistoricalEvents: (startBlock: number, endBlock: number) => Promise<ExecutedTransaction[]>;
}
