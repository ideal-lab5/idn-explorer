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

import { DelayedTransaction } from '@/domain/DelayedTransaction';
import { DelayedTransactionDetails } from '@/domain/DelayedTransactionDetails';
import { ExecutedTransaction } from '@/domain/ExecutedTransaction';
import { Randomness } from '@/domain/Randomness';
import { SupportedCurve, Timelock } from '@ideallabs/timelock.js';
import { EventRecord } from '@polkadot/types/interfaces';
import { inject, injectable } from 'tsyringe';
import type { IExplorerService } from './IExplorerService';
import type { IPolkadotApiService } from './IPolkadotApiService';

@injectable()
export class ExplorerService implements IExplorerService {
  private tLockApi: Timelock | null = null;
  private featureScheduleTransaction: boolean = false;

  constructor(@inject('IPolkadotApiService') private polkadotApiService: IPolkadotApiService) {
    if (process.env.FEATURE_SCHEDULE_TRANSACTION) {
      this.featureScheduleTransaction = process.env.FEATURE_SCHEDULE_TRANSACTION == 'enabled';
    }
    this.initializeTlock();
  }

  async initializeTlock() {
    if (!this.tLockApi) {
      this.tLockApi = await Timelock.build(SupportedCurve.BLS12_381);
    }
  }

  async getRandomness(blockNumber: number, size: number = 10): Promise<Randomness[]> {
    const polkadotApi = await this.polkadotApiService.getApi();
    let listOfGeneratedRandomness: Randomness[] = [];

    if (!polkadotApi?.query?.randomnessBeacon?.pulses) {
      return listOfGeneratedRandomness;
    }

    let i: number = 0;
    while (i < size && blockNumber - i >= 0) {
      let nextBlock: number = blockNumber - i;
      try {
        const pulse = await polkadotApi.query.randomnessBeacon.pulses(nextBlock);
        const pulseData = pulse.toHuman() as any;
        if (pulseData) {
          // Use proper type assertion for the complex structure
          const body = pulseData['body'] as any;
          const result = new Randomness(nextBlock, body?.randomness || '', body?.signature || '');
          if (result.randomness !== '') {
            listOfGeneratedRandomness.push(result);
          }
        }
      } catch (e: any) {
        console.error(`Error fetching randomness for block ${nextBlock}:`, e?.message || e);
      }
      i++;
    }
    return listOfGeneratedRandomness;
  }

  async scheduleTransaction(
    signer: any,
    transactionDetails: DelayedTransactionDetails
  ): Promise<void> {
    if (this.featureScheduleTransaction) {
      const polkadotApi = await this.polkadotApiService.getApi();

      // Get the inner call using Polkadot API
      const tx = polkadotApi.tx[transactionDetails.pallet][transactionDetails.extrinsic];
      if (!tx) {
        throw new Error(
          `Invalid extrinsic: ${transactionDetails.pallet}.${transactionDetails.extrinsic}`
        );
      }

      // Parse parameters
      const params = transactionDetails.params.map(param => {
        if (param.value === 'true') return true;
        if (param.value === 'false') return false;
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
          // Transaction confirmed in block
        }
      });
    } else {
      console.error('The Schedule Transaction Feature is not currently implemented');
    }
  }

  async getScheduledTransactions(): Promise<DelayedTransaction[]> {
    const polkadotApi = await this.polkadotApiService.getApi();
    let listOfTransactions: DelayedTransaction[] = [];
    if (!polkadotApi?.query?.scheduler?.agenda) {
      return listOfTransactions;
    }
    const entries = await polkadotApi.query.scheduler.agenda.entries();
    entries.forEach(([key, value]: [any, any]) => {
      for (const humanValue of value.map((v: any) => v.toHuman())) {
        if (humanValue.maybeCiphertext) {
          const delayedTx = new DelayedTransaction(
            'NA',
            humanValue.maybeId,
            humanValue.origin.system.Signed,
            'Extrinsic Call',
            key.toHuman()[0]
          );
          listOfTransactions.push(delayedTx);
        }
      }
    });
    return listOfTransactions;
  }

  async queryHistoricalEvents(
    startBlock: number,
    endBlock: number
  ): Promise<ExecutedTransaction[]> {
    const polkadotApi = await this.polkadotApiService.getApi();
    let listOfEvents: ExecutedTransaction[] = [];

    // Define IDN pallet names we're interested in
    const idnPallets = ['idnManager', 'randBeacon', 'randomnessBeacon'];

    for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
      try {
        let events: EventRecord[] = [];
        try {
          const blockHash = await polkadotApi.rpc.chain.getBlockHash(blockNumber);

          try {
            events = await polkadotApi.query.system.events.at(blockHash);
          } catch (eventErr) {
            // If events query fails, we'll just have an empty events array
            // No need to log this error as it's expected with some Substrate versions
          }
        } catch (blockErr) {
          // If we can't get the block hash, skip this block
          continue;
        }

        // If we have no events, skip processing this block
        if (!events || !events.length) continue;

        // Process events directly, focusing on IDN pallets
        events.forEach((record: EventRecord, index: number) => {
          try {
            const { event, phase } = record;
            if (!event || !event.section || !event.method) return;

            const operation = `${event.section}.${event.method}`;

            // Focus on IDN pallet events or important system events
            const isIdnEvent = idnPallets.some(pallet =>
              event.section.toLowerCase().includes(pallet.toLowerCase())
            );
            const isImportantSystemEvent =
              event.section === 'system' &&
              ['ExtrinsicSuccess', 'ExtrinsicFailed', 'NewAccount'].includes(event.method);
            const isSchedulerEvent = event.section === 'scheduler';

            if (!isIdnEvent && !isImportantSystemEvent && !isSchedulerEvent) {
              return; // Skip non-IDN events to reduce noise
            }

            let eventData: any[] = [];
            try {
              eventData = event.data.map((data: any, i: number) => ({
                type: event.typeDef?.[i]?.type || 'Unknown',
                value: data.toString(),
              }));
            } catch (e: any) {
              // Fallback for events that can't be properly decoded
              eventData = [{ type: 'DecodingError', value: 'Unable to decode event data' }];
            }

            // Determine transaction status and signer
            let status = 'Confirmed';
            let signer = 'System';
            let extrinsicIndex = 'sys';

            if (phase?.isApplyExtrinsic) {
              try {
                extrinsicIndex = phase.asApplyExtrinsic.toString();

                // Try to determine signer from event data if it looks like an address
                const potentialSigner = eventData.find(
                  data => typeof data.value === 'string' && this.looksLikeAddress(data.value)
                );
                if (potentialSigner) {
                  signer = potentialSigner.value;
                }
              } catch (e: any) {
                // Fallback for phase decoding issues
                extrinsicIndex = 'unknown';
              }
            }

            const executedTransaction = new ExecutedTransaction(
              blockNumber,
              `${blockNumber}-${extrinsicIndex}-${index}`,
              signer,
              operation,
              status,
              eventData,
              event.meta?.docs?.map((d: any) => d.toString().trim()) || [],
              isSchedulerEvent || isIdnEvent
            );

            listOfEvents.push(executedTransaction);
          } catch (e: any) {
            // Only errors from IDN-related events would be worth logging
            if (
              record?.event?.section &&
              idnPallets.some(pallet =>
                record.event.section.toLowerCase().includes(pallet.toLowerCase())
              )
            ) {
              // Use console.debug instead of warn to make it less prominent
              console.debug(`Error processing IDN event ${blockNumber}-${index}`);
            }
          }
        });
      } catch (e: any) {
        console.debug(`Skipping block ${blockNumber}`);
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

    return new Promise((resolve, reject) => {
      polkadotApi.tx.scheduler
        .cancel(blockNumber, index)
        .signAndSend(signer.address, { signer: signer.signer }, (result: any) => {
          if (result.status.isInBlock) {
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
