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

import { injectable, inject } from "tsyringe";
import type { IExplorerService } from "./IExplorerService";
import type { IPolkadotApiService } from "./IPolkadotApiService";
import {SupportedCurve, Timelock} from "@ideallabs/timelock.js";
import { Randomness } from "@/domain/Randomness";
import { DelayedTransaction } from "@/domain/DelayedTransaction";
import { ExecutedTransaction } from "@/domain/ExecutedTransaction";
import { DelayedTransactionDetails } from "@/domain/DelayedTransactionDetails";
import { EventRecord } from '@polkadot/types/interfaces';

@injectable()
export class ExplorerService implements IExplorerService {
  private tLockApi: Timelock | null = null;
  private featureScheduleTransaction: boolean = false;

  constructor(
    @inject('IPolkadotApiService') private polkadotApiService: IPolkadotApiService
  ) {

    if (process.env.FEATURE_SCHEDULE_TRANSACTION) {
      this.featureScheduleTransaction = process.env.FEATURE_SCHEDULE_TRANSACTION == "enabled";
    }
    this.initializeTlock().then(()=> {
      console.log("TLock WASM has been initialized");
    })
  }

  async initializeTlock() {
    if(!this.tLockApi) {
      this.tLockApi = await Timelock.build(SupportedCurve.BLS12_381);
    }
  }

  async getRandomness(blockNumber: number, size: number = 10): Promise<Randomness[]> {
    const polkadotApi = await this.polkadotApiService.getApi();
    let listOfGeneratedRandomness: Randomness[] = [];

    if (!polkadotApi?.query?.randomnessBeacon?.pulses) {
      console.log("Network Without Randomness Beacon");
      return listOfGeneratedRandomness;
    }

    let i: number = 0;
    while (i < size && (blockNumber - i >= 0)) {
      let nextBlock: number = blockNumber - i;
      try {
        const pulse = await polkadotApi.query.randomnessBeacon.pulses(nextBlock);
        const pulseData = pulse.toHuman() as any;
        if (pulseData) {
          // Use proper type assertion for the complex structure
          const body = pulseData['body'] as any;
          const result = new Randomness(
            nextBlock,
            body?.randomness || "",
            body?.signature || ""
          );
          if (result.randomness !== "") {
            listOfGeneratedRandomness.push(result);
          }
        }
      } catch (e) {
        console.error(`Error fetching randomness for block ${nextBlock}:`, e);
      }
      i++;
    }
    return listOfGeneratedRandomness;
  }

  async scheduleTransaction(signer: any, transactionDetails: DelayedTransactionDetails): Promise<void> {
    if(this.featureScheduleTransaction) {

      const polkadotApi = await this.polkadotApiService.getApi();

      // Get the inner call using Polkadot API
      const tx = polkadotApi.tx[transactionDetails.pallet][transactionDetails.extrinsic];
      if (!tx) {
        throw new Error(`Invalid extrinsic: ${transactionDetails.pallet}.${transactionDetails.extrinsic}`);
      }

      // Parse parameters
      const params = transactionDetails.params.map(param => {
        if (param.value === "true") return true;
        if (param.value === "false") return false;
        if (!isNaN(param.value)) return Number(param.value);
        return param.value;
      });

      // Create the inner call
      const innerCall = tx(...params);

      // This outer call should be done with the IDN in the future.
      const outerCall = tx(...params);

      // Sign and send using Polkadot API
      await outerCall.signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
        if (result.status.isInBlock) {
          console.log('Transaction in block:', result.status.asInBlock.toHex());
        }
      });

    } else {
      console.error("The Schedule Transaction Feature is not currently implemented");
    }
    
  }

  async getScheduledTransactions(): Promise<DelayedTransaction[]> {
    const polkadotApi = await this.polkadotApiService.getApi();
    let listOfTransactions: DelayedTransaction[] = [];
    if (!polkadotApi?.query?.scheduler?.agenda) {
      console.log("Network Without Randomness Beacon");
      return listOfTransactions;
    }
    const entries = await polkadotApi.query.scheduler.agenda.entries();
    entries.forEach(([key, value]: [any, any]) => {
      for (const humanValue of value.map((v: any) => v.toHuman())) {
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
    return listOfTransactions;
  }

  async queryHistoricalEvents(startBlock: number, endBlock: number): Promise<ExecutedTransaction[]> {
    const polkadotApi = await this.polkadotApiService.getApi();
    let listOfEvents: ExecutedTransaction[] = [];

    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
      try {
        // Get the block hash and block
        const blockHash = await polkadotApi.rpc.chain.getBlockHash(blockNumber);
        const signedBlock = await polkadotApi.rpc.chain.getBlock(blockHash);
        const events = await polkadotApi.query.system.events.at(blockHash);

        // Process extrinsics and their events
        signedBlock.block.extrinsics.forEach((extrinsic, index) => {
          const { method, signer } = extrinsic;

          // Find events for this extrinsic
          const relatedEvents = (events as any)?.filter(({ phase }: any) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
          );

          // Determine transaction status
          let status = 'Pending';
          relatedEvents.forEach((record: EventRecord) => {
            const { event } = record;
            if (event.section === 'system') {
              if (event.method === 'ExtrinsicSuccess') status = 'Confirmed';
              else if (event.method === 'ExtrinsicFailed') status = 'Failed';
            }
          });

          // Process each event
          relatedEvents.forEach((record: EventRecord) => {
            const { event } = record;
            const operation = `${event.section}.${event.method}`;

            const eventData = event.data.map((data: any, i: number) => ({
              type: event.typeDef[i].type,
              value: data.toString()
            }));

            const executedTransaction = new ExecutedTransaction(
              blockNumber,
              `${blockNumber}-${index}`,
              signer?.toString() || 'Unsigned',
              operation,
              status,
              eventData,
              event.meta.docs.map((d: any) => d.toString().trim()),
              operation === "scheduler.Scheduled"
            );

            listOfEvents.push(executedTransaction);
          });
        });

        // Handle system events
        (events as any)?.filter((phase: any) => phase.isFinalization || phase.isInitialization)
          .forEach((record: any, index: number) => {
            const { event } = record;
            const eventData = event.data.map((data: any, i: number) => ({
              type: event.typeDef[i].type,
              value: data.toString()
            }));

            const operation = `${event.section}.${event.method}`;
            const executedTransaction = new ExecutedTransaction(
              blockNumber,
              `${blockNumber}-sys-${index}`,
              this.looksLikeAddress(eventData[0]?.value) ? eventData[0].value : "System",
              operation,
              'Confirmed',
              eventData,
              event.meta.docs.map((d: any) => d.toString().trim()),
              operation === "scheduler.Dispatched" || this.looksLikeAddress(eventData[0]?.value)
            );

            listOfEvents.push(executedTransaction);
          });
      } catch (e) {
        console.error(`Error processing block ${blockNumber}:`, e);
      }
    }

    listOfEvents.reverse();
    return listOfEvents;
  }

  async getFreeBalance(signer: any): Promise<string> {
    const polkadotApi = await this.polkadotApiService.getApi();
    // Get account info and properly handle typing
    const accountInfo: any = await polkadotApi.query.system.account(signer.address);
    // Access data and free balance with proper type casting
    const balance = (accountInfo as any).data || accountInfo;
    const freeBalance = (balance as any).free;
    
    return freeBalance?.toHuman() || '0';
  }

  async cancelTransaction(signer: any, blockNumber: number, index: number): Promise<void> {
    const polkadotApi = await this.polkadotApiService.getApi();
    console.log('Canceling transaction', blockNumber, index, signer);

    return new Promise((resolve, reject) => {
      polkadotApi.tx.scheduler.cancel(blockNumber, index)
        .signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
          if (result.status.isInBlock) {
            console.log('Transaction included in block:', result.status.asInBlock.toHex());
            resolve();
          }

          if (result.dispatchError) {
            if (result.dispatchError.isModule) {
              const decoded = polkadotApi.registry.findMetaError(result.dispatchError.asModule);
              const decodedError = `Module Error: ${decoded.section}.${decoded.method}: ${decoded.docs}`;
              console.error(decodedError);
              reject(new Error(decodedError));
            } else {
              const error = result.dispatchError.toString();
              console.error('Dispatch error:', error);
              reject(new Error(error));
            }
          }
        })
        .catch((e: any) => {
          console.error('Error canceling transaction:', e);
          reject(e);
        });
    });
  }

  private looksLikeAddress(value: string): boolean {
    return value?.startsWith('0x') || value?.length >= 48;
  }
}
