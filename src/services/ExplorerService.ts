import { singleton } from "tsyringe";
import { IExplorerService } from "./IExplorerService";
import { cryptoWaitReady } from '@polkadot/util-crypto';
import chainSpec from "../etf_spec/dev/etf_spec.json"
import { Etf } from "@ideallabs/etf.js";
import { Pulse } from "@ideallabs/etf.js/dist/types";
import { Randomness } from "@/domain/Randomness";
import { DelayedTransaction } from "@/domain/DelayedTransaction";
import { ExecutedTransaction } from "@/domain/ExecutedTransaction";
import { DelayedTransactionDetails } from "@/domain/DelayedTransactionDetails";

@singleton()
export class ExplorerService implements IExplorerService {

  api: any;
  CUSTOM_TYPES: any;
  abi: any;
  node_dev = "ws://127.0.0.1:9944";
  constructor() {
    this.getEtfApi().then(() => {
      console.log("ETF.js API is ready.");
    });
  };

  async getEtfApi(signer = undefined): Promise<any> {
    // ensure params are defined
    if (process.env.NEXT_PUBLIC_NODE_WS === undefined) {
      console.error("Provide a valid value for NEXT_PUBLIC_NODE_DETAILS. Using fallback");
      process.env.NEXT_PUBLIC_NODE_WS = this.node_dev;
      // return Promise.resolve(null);
    }

    if (!this.api) {

      try {
        await cryptoWaitReady();
        let api = new Etf(process.env.NEXT_PUBLIC_NODE_WS, false);
        console.log("Connecting to ETF chain");
        await api.init(JSON.stringify(chainSpec));
        this.api = api;
      } catch (_e) {
        // TODO: next will try to fetch the wasm blob but it doesn't need to
        // since the transitive dependency is built with the desired wasm already
        // so we can ignore this error for now (no impact to functionality)
        // but shall be addressed in the future
      }
    }
    if (signer) {
      this.api.api.setSigner(signer);
    }
    console.log("api initialized")
    return Promise.resolve(this.api);
  };

  async getRandomness(blockNumber: number, size: number = 10): Promise<Randomness[]> {
    let api = await this.getEtfApi();
    let listOfGeneratedRandomness: Randomness[] = [];
    let i: number = 0;
    while (i < size && (blockNumber - i >= 0)) {
      let nextBlock: number = blockNumber - i;
      let result = await api.api.query.randomnessBeacon.pulses(nextBlock).then((pulse: any) => {
        return new Randomness(
          nextBlock,
          pulse.toHuman() != null ? pulse?.toHuman()['body']?.randomness as string : "",
          pulse.toHuman() != null ? pulse?.toHuman()['body']?.signature as string : ""
        );
      });
      if (result.randomness != "") {
        listOfGeneratedRandomness.push(result);
      }
      i++;
    }
    return Promise.resolve(listOfGeneratedRandomness);
  }

  async scheduleTransaction(signer: any, transactionDetails: DelayedTransactionDetails): Promise<void> {
    let api = await this.getEtfApi(signer.signer);
    let innerCall = api.api.tx.balances
      .transferKeepAlive('5CMHXGNmDzSpQotcBUUPXyR8jRqfKttXuU87QraJrydrMdcz', 100);
    let deadline = transactionDetails.block;
    let outerCall = await api.delay(innerCall, 127, deadline);
    await outerCall.signAndSend(signer.address, (result: any) => {
      if (result.status.isInBlock) {
        console.log('in block')
      }
    });
  }

  async getScheduledTransactions(): Promise<DelayedTransaction[]> {
    let api = await this.getEtfApi();
    let listOfTransactions: DelayedTransaction[] = [];
    let entries = await api.api.query.scheduler.agenda.entries();
    console.log("scheduled group of transactions: ", entries.length);
    entries.forEach(([key, value]: [any, any]) => {
      console.log(key);
      for (let i = 0; i < value.length; i++) {
        console.log(`Value ${i}: `, value[i].toHuman());
      }
    });
    //TODO: get upcoming txs
    return Promise.resolve(listOfTransactions);
  }

  async queryHistoricalEvents(startBlock: number, endBlock: number): Promise<ExecutedTransaction[]> {
    let api = await this.getEtfApi();
    let listOfEvents: ExecutedTransaction[] = [];
    // Connect to the node
    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
      // Get the block hash
      const blockHash = await api.api.rpc.chain.getBlockHash(blockNumber);
      // Get the block to fetch extrinsics
      const block = await api.api.rpc.chain.getBlock(blockHash);
      // Get the events for the block
      const events = await api.api.query.system.events.at(blockHash);
      events.forEach(({ event, phase }) => {
        const { section, method, data } = event;

        if (phase.isApplyExtrinsic) {
          const extrinsicIndex = phase.asApplyExtrinsic.toNumber();
          const extrinsic = block.block.extrinsics[extrinsicIndex];

          // Compute the extrinsic hash
          const extrinsicHash = extrinsic.hash.toHex();
          // Extract the signer (who sent the extrinsic)
          const signer = extrinsic.signer.toString();

          // Check for status (Success or Failed)
          const isSuccess = api.api.events.system.ExtrinsicSuccess.is(event);
          const isFailed = api.api.events.system.ExtrinsicFailed.is(event);
          const status = isSuccess ? 'Confirmed' : isFailed ? 'Failed' : 'Unknown';

          // Format data to be more human-readable
          const eventData = data.map((item: any) => item.toString());
          // Build the result object
          const result: ExecutedTransaction = new ExecutedTransaction(
            blockNumber,
            extrinsicHash,
            signer,
            `${section}.${method}`,
            status,
            eventData
          )
          // Push the result to the list
          listOfEvents.push(result);
        }
      });
    }
    return Promise.resolve(listOfEvents.reverse());
  }

}