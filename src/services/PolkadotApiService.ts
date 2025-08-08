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

import { ApiPromise, WsProvider } from '@polkadot/api';
import { injectable } from 'tsyringe';
import { IPolkadotApiService } from './IPolkadotApiService';

@injectable()
export class PolkadotApiService implements IPolkadotApiService {
  private api: ApiPromise | null = null;
  private wsProvider: WsProvider | null = null;
  private connectionPromise: Promise<ApiPromise> | null = null;
  private readyCallbacks: (() => void)[] = [];
  private disconnectCallbacks: (() => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  constructor() {
    // Don't initialize in constructor, wait for first getApi call
  }

  private getNodeUrl(): string {
    return process.env.NEXT_PUBLIC_NODE_WS || 'wss://rpc.polkadot.io';
  }

  /**
   * Set up global console error interceptor to filter out specific Polkadot.js API errors
   * This will suppress known non-critical errors that flood the console
   */
  private setupErrorInterceptor() {
    // Store the original console.error
    const originalConsoleError = console.error;

    // Replace console.error with our filtered version
    console.error = (...args: any[]) => {
      // Convert args to string for easier filtering
      const errorString = args.join(' ');

      // List of error patterns to filter out
      const ignoredPatterns = [
        'Unsupported unsigned extrinsic version 5',
        'Unable to decode on index 0',
        'createTypeExtrinsicUnknown',
        'createType(SignedBlock): Struct: failed',
        'getBlockHash?: BlockHash}: SignedBlock',
        'Vec<ExtrinsicV4>',
        'RPC-CORE', // Filter RPC core errors which are mostly version mismatches
      ];

      // Check if this error matches any pattern we want to filter
      const shouldFilter = ignoredPatterns.some(pattern => errorString.includes(pattern));

      // Only log errors that don't match our filter patterns
      if (!shouldFilter)
        originalConsoleError(...args);
    };
  }

  private async initApi(): Promise<ApiPromise> {
    // Set up error interceptor before any API calls
    this.setupErrorInterceptor();

    try {
      if (!this.wsProvider) {
        this.wsProvider = new WsProvider(this.getNodeUrl());

        // Set up event handlers before creating API
        this.wsProvider.on('connected', () => {
          this.notifyReady();
        });

        this.wsProvider.on('disconnected', () => {
          // Clear the API instance on disconnect so we can reconnect fresh
          this.api = null;
          this.connectionPromise = null;
          this.notifyDisconnect();
        });

        this.wsProvider.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          // Clear connection state on error
          this.api = null;
          this.connectionPromise = null;
          this.notifyError(error);
        });
      }

      this.api = await ApiPromise.create({
        provider: this.wsProvider,
        throwOnConnect: true, // Make connection errors more explicit
      });

      await this.api.isReady;
      return this.api;
    } catch (error) {
      // Clear connection state on error
      this.api = null;
      this.connectionPromise = null;
      console.error('Failed to initialize Polkadot API:', error);
      const apiError = error instanceof Error ? error : new Error('Failed to initialize API');
      this.notifyError(apiError);
      throw apiError;
    }
  }

  async getApi(): Promise<ApiPromise> {
    // If we already have a working API instance, return it
    if (this.api?.isConnected) {
      return this.api;
    }

    // If we're in the process of connecting, wait for that to finish
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Start a new connection
    this.connectionPromise = this.initApi();
    return this.connectionPromise;
  }

  async isReady(): Promise<boolean> {
    try {
      const api = await this.getApi();
      return api.isConnected;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
    if (this.wsProvider) {
      await this.wsProvider.disconnect();
      this.wsProvider = null;
    }
    this.connectionPromise = null;
    this.notifyDisconnect();
  }

  onReady(callback: () => void): void {
    this.readyCallbacks.push(callback);
    // If already ready, call immediately
    if (this.api?.isConnected) {
      callback();
    }
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  private notifyReady(): void {
    this.readyCallbacks.forEach(callback => callback());
  }

  private notifyDisconnect(): void {
    this.disconnectCallbacks.forEach(callback => callback());
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }
}
