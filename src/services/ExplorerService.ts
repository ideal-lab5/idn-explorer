import { singleton } from "tsyringe";
import { IExplorerService } from "./IExplorerService";
import { cryptoWaitReady } from '@polkadot/util-crypto';
import chainSpec from "../etf_spec/dev/etf_spec.json"
import { Etf } from "@ideallabs/etf.js";
import { Randomness } from "@/domain/Randomness";
import { DelayedTransaction } from "@/domain/DelayedTransaction";
import { ExecutedTransaction } from "@/domain/ExecutedTransaction";
import { DelayedTransactionDetails } from "@/domain/DelayedTransactionDetails";
import { EventRecord, SignedBlock } from '@polkadot/types/interfaces';

@singleton()
export class ExplorerService implements IExplorerService {

  api: any;
  node_dev: string = "ws://127.0.0.1:9944";

  constructor() {
    this.getEtfApi().then(() => {
      console.log("ETF.js API is ready.");
    });
  };

  async getEtfApi(signer = undefined): Promise<any> {

    if (!this.api) {
      // ensure params are defined
      if (process.env.NEXT_PUBLIC_NODE_WS === undefined) {
        console.error("Provide a valid value for NEXT_PUBLIC_NODE_DETAILS. Using fallback");
        process.env.NEXT_PUBLIC_NODE_WS = this.node_dev;
      }

      try {
        await cryptoWaitReady();
        let api = new Etf(process.env.NEXT_PUBLIC_NODE_WS, false);
        console.log("Connecting to ETF chain");
        await api.init(JSON.stringify(chainSpec));
        this.api = api;
        console.log("api initialized")
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
    return Promise.resolve(this.api);
  };

  async getRandomness(blockNumber: number, size: number = 10): Promise<Randomness[]> {
    const api = await this.getEtfApi();
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
    const api = await this.getEtfApi(signer.signer);
    let extrinsicPath = `api.api.tx.${transactionDetails.pallet}.${transactionDetails.extrinsic}`;
    let parametersPath = "(";
    if (transactionDetails.params.length > 0) {
      transactionDetails.params.forEach((param: any) => {
        if (isNaN(param.value) && param.value != "true" && param.value != "false") {
          parametersPath += `"${param.value}", `;
        }
        else {
          parametersPath += `${param.value}, `;
        }
      });
      parametersPath = parametersPath.slice(0, -2);
    }
    parametersPath += ")";
    extrinsicPath += parametersPath;
    let innerCall = eval(extrinsicPath);
    let deadline = transactionDetails.block;
    let outerCall = await api.delay(innerCall, 127, deadline);
    await outerCall.signAndSend(signer.address, (result: any) => {
      if (result.status.isInBlock) {
        console.log('in block')
      }
    });
    return Promise.resolve();
  }

  async getScheduledTransactions(): Promise<DelayedTransaction[]> {
    const api = await this.getEtfApi();
    let listOfTransactions: DelayedTransaction[] = [];
    let entries = await api.api.query.scheduler.agenda.entries();
    entries.forEach(([key, value]: [any, any]) => {
      for (const humanValue of value.map((v: any) => v.toHuman())) {
        //we are only interested on those txs scheduled to be executed in the future
        if (humanValue.maybeCiphertext) {
          const delayedTx = new DelayedTransaction(
            "NA",
            humanValue.maybeId,
            humanValue.origin.system.Signed,
            "Extrinsic Call",
            key.toHuman()[0]
          );
          listOfTransactions.push(delayedTx);
        }
      }
    });
    return Promise.resolve(listOfTransactions);
  }

  async queryHistoricalEvents(startBlock: number, endBlock: number): Promise<ExecutedTransaction[]> {
    let api = await this.getEtfApi();
    let listOfEvents: ExecutedTransaction[] = [];
    // Connect to the node
    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
      // Get the block hash
      const blockHash = await api.api.rpc.chain.getBlockHash(blockNumber);
      const signedBlock: SignedBlock = await api.api.rpc.chain.getBlock(blockHash);
      // Get the block to fetch extrinsics
      const block = await api.api.rpc.chain.getBlock(blockHash);
      // Get the events for the block
      const events = await api.api.query.system.events.at(blockHash);
      // Loop through the extrinsics to get the signer (owner) of each transaction
      signedBlock.block.extrinsics.forEach((extrinsic, index) => {
        const { method, signer } = extrinsic;
        // Find all the events associated with this extrinsic
        const relatedEvents = events.filter(({ phase }: { phase: any }) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
        );
        // Check for success or failure in the related events
        let status = 'Pending'; // Default status
        relatedEvents.forEach((record: EventRecord) => {
          const { event } = record;
          if (event.section === 'system' && event.method === 'ExtrinsicSuccess') {
            status = 'Confirmed'; // Set status as Success if the ExtrinsicSuccess event is present
          } else if (event.section === 'system' && event.method === 'ExtrinsicFailed') {
            status = 'Failed'; // Set status as Failed if the ExtrinsicFailed event is present
          }
        });
        // For each event related to this extrinsic
        relatedEvents.forEach((record: EventRecord) => {
          const { event } = record;
          const types = event.typeDef;
          const operation = `${event.section}.${event.method}`;
          // Create a new ExecutedTransaction instance
          const executedTransaction = new ExecutedTransaction(
            blockNumber,                              // block
            `${blockNumber}-${index}`,                // id (unique per block and event index)
            signer?.toString() || 'Unsigned',         // signer (owner) from the extrinsic
            operation,       // operation (e.g., balances.Transfer)
            status,                                   // actual status based on the events
            event.data.map((data, i) => ({            // eventData (raw event data)
              type: types[i].type,
              value: data.toString()
            })),
            event?.meta?.docs?.map(meta => meta.toString().trim()),
            operation === "scheduler.Scheduled"
          );
          // Add the transaction to the array
          listOfEvents.push(executedTransaction);
        });
      });
      // Handle system events that are not tied to extrinsics
      const systemEvents = events.filter(({ phase }: { phase: any }) => phase.isFinalization || phase.isInitialization);
      systemEvents.forEach((record: EventRecord, index: number) => {
        const { event } = record;
        const types = event.typeDef;
        // Helper function to determine if a value is a valid hex address
        function looksLikeAddress(value: string): boolean {
          return value?.startsWith('0x') || value?.length >= 48;
        }
        const eventData = event.data.map((data, i) => ({
          type: types[i].type,
          value: data.toString(),
        }));
        // Create a new ExecutedTransaction instance for system events
        const operation = `${event.section}.${event.method}`;
        const executedTransaction = new ExecutedTransaction(
          blockNumber,                              // block
          `${blockNumber}-sys-${index}`,            // id (unique per block and system event index)
          looksLikeAddress(eventData[0]?.value) ? eventData[0]?.value : "System",
          operation,       // operation (e.g., system.Finalized)
          'Confirmed',                                // Status for system events is usually successful
          eventData,
          event?.meta?.docs?.map(meta => meta.toString().trim()),
          operation === "scheduler.Dispatched" || looksLikeAddress(eventData[0]?.value)
        );
        // Add the transaction to the array
        listOfEvents.push(executedTransaction);
      });
    }

    listOfEvents.reverse()
    return Promise.resolve(listOfEvents);
  }

  async getFreeBalance(signer: any): Promise<string> {
    const api = await this.getEtfApi(signer);
    const accountInfo = await api.api.query.system.account(signer.address);
    return Promise.resolve(accountInfo.data.free.toHuman());
  }

  async cancelTransaction(signer: any, blockNumber: number, index: number): Promise<void> {
    console.log('canceling transaction', blockNumber, index, signer);
    const api = await this.getEtfApi(signer);
    // Initialize keyring and add the account using the string value
    await api.api.tx.scheduler.cancel(blockNumber, index).signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
      if (result.status.isInBlock) {
        console.log('in block');
      }
      // Check if there is a dispatch error
      if (result.dispatchError) {
        if (result.dispatchError.isModule) {
          // Decode the module error
          const decoded = api.api.registry.findMetaError(result.dispatchError.asModule);
          console.error(`Error: ${JSON.stringify(decoded)}`);
        } else {
          // Handle other errors (non-module errors)
          console.error(`Error: ${result.dispatchError.toString()}`);
        }
      } else {
        console.log('Extrinsic executed successfully');
      }
    });

    return Promise.resolve();
  }

}