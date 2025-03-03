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

import { formatBalance } from '@polkadot/util';
import { inject, singleton } from 'tsyringe';
import type { IChainStateService, SessionInfo, BlockHeader } from './IChainStateService';
import type { IPolkadotApiService } from './IPolkadotApiService';

@singleton()
export class ChainStateService implements IChainStateService {
  constructor(
    @inject('IPolkadotApiService') private polkadotApiService: IPolkadotApiService
  ) {}

  async getBalance(address: string): Promise<string> {
    try {
      const api = await this.polkadotApiService.getApi();
      const { data: balance } = await api.query.system.account(address);
      return formatBalance(balance.free, { withUnit: true });
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async subscribeToBlocks(callback: (blockNumber: number) => void): Promise<() => void> {
    return this.subscribeToNewHeaders((header) => callback(header.blockNumber));
  }

  async subscribeToNewHeaders(callback: (header: BlockHeader) => void): Promise<() => void> {
    const api = await this.polkadotApiService.getApi();
    const unsubscribe = await api.rpc.chain.subscribeNewHeads((lastHeader) => {
      const header: BlockHeader = {
        blockNumber: lastHeader.number.toNumber(),
        blockHash: lastHeader.hash.toHex(),
        parentHash: lastHeader.parentHash.toHex(),
        stateRoot: lastHeader.stateRoot.toHex(),
        extrinsicsRoot: lastHeader.extrinsicsRoot.toHex(),
      };
      callback(header);
    });
    return unsubscribe;
  }

  async getSessionInfo(): Promise<SessionInfo> {
    const api = await this.polkadotApiService.getApi();
    const progress = await api.derive.session.progress();
    
    return {
      sessionProgress: progress.sessionProgress.toNumber(),
      sessionLength: progress.sessionLength.toNumber(),
      eraProgress: progress.eraProgress.toNumber(),
      sessionsPerEra: progress.sessionsPerEra.toNumber()
    };
  }

  async getEpochIndex(): Promise<number> {
    const api = await this.polkadotApiService.getApi();
    const epochInfo = await api.query.babe.epochIndex();
    return epochInfo.toNumber();
  }

  async subscribeToBalanceChanges(
    address: string,
    callback: (balance: string) => void
  ): Promise<() => void> {
    const api = await this.polkadotApiService.getApi();
    const unsubscribe = await api.query.system.account(
      address,
      ({ data: balance }) => {
        callback(formatBalance(balance.free, { withUnit: true }));
      }
    );
    return unsubscribe;
  }

  async getPallets(): Promise<{ text: string; value: string; }[]> {
    const api = await this.polkadotApiService.getApi();
    return Object.keys(api.tx)
      .filter((s) => !s.startsWith('$'))
      .sort()
      .filter((name): number => Object.keys(api.tx[name]).length)
      .map((name) => ({
        text: name,
        value: name
      }));
  }

  async getExtrinsics(pallet: string): Promise<string[]> {
    const api = await this.polkadotApiService.getApi();
    const palletApi = api.tx[pallet as keyof typeof api.tx];
    if (palletApi) {
      return Object.keys(palletApi);
    }
    return [];
  }

  async getExtrinsicParameters(pallet: string, extrinsic: string): Promise<{ name: string; type: string; typeName: string; }[]> {
    const api = await this.polkadotApiService.getApi();
    const extrinsicMeta = api.tx[pallet][extrinsic].meta;
    return extrinsicMeta.args.map((arg) => ({
      name: arg.name.toString(),
      type: arg.type.toString(),
      typeName: arg.typeName.unwrapOrDefault().toString()
    }));
  }
}
