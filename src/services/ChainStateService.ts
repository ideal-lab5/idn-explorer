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
import { inject, injectable } from 'tsyringe';
import type { IChainStateService, SessionInfo, BlockHeader } from './IChainStateService';
import type { IPolkadotApiService } from './IPolkadotApiService';

@injectable()
export class ChainStateService implements IChainStateService {
  constructor(
    @inject('IPolkadotApiService') private polkadotApiService: IPolkadotApiService
  ) {}

  async getBalance(address: string): Promise<string> {
    try {
      const api = await this.polkadotApiService.getApi();
      // Get account info and access balance directly
      const accountInfo: any = await api.query.system.account(address);
      // Access the free balance from the account info based on the API structure
      // Handle both older and newer Polkadot API versions with proper type casting
      const freeBalance = (accountInfo as any).data?.free || (accountInfo as any).free;
      
      return formatBalance(freeBalance, { withUnit: true });
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0'; // Return a default value on error
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

  async getSessionIndex(): Promise<number> {
    const api = await this.polkadotApiService.getApi();
    
    // Ideal Network uses Aura consensus with sessions
    try {
      // Check if session pallet is available
      if (api.query.session?.currentIndex) {
        const sessionIndex = await api.query.session.currentIndex();
        return Number(sessionIndex.toString());
      }
      
      // Fallback: use current block number divided by session length as rough session
      const header = await api.rpc.chain.getHeader();
      const blockNumber = Number(header.number.toString());
      // Assume roughly 600 blocks per session (10 minutes at 1 block per second)
      return Math.floor(blockNumber / 600);
    } catch (error: any) {
      console.warn('Unable to determine session index for Aura consensus:', error?.message || error);
      // Return current timestamp as fallback session indicator
      return Math.floor(Date.now() / (1000 * 60 * 10)); // 10-minute sessions
    }
  }

  async subscribeToBalanceChanges(
    address: string,
    callback: (balance: string) => void
  ): Promise<() => void> {
    const api = await this.polkadotApiService.getApi();
    const unsubscribe = await api.query.system.account(
      address,
      (accountInfo: any) => {
        // Access the free balance from the account info based on the API structure
        // This handles both older and newer Polkadot API versions
        const freeBalance = accountInfo.data?.free || accountInfo.free;
        callback(formatBalance(freeBalance, { withUnit: true }));
      }
    );
    // Cast to the expected return type
    return unsubscribe as unknown as () => void;
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
