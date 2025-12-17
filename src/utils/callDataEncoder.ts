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

import { decodeAddress } from '@polkadot/util-crypto';

/**
 * Call data types for subscriptions
 */
export type SubscriptionType = 'runtime' | 'contract';

/**
 * Decoded runtime call data
 */
export interface RuntimeCallData {
  type: 'runtime';
  palletIndex: number;
  callIndex: number;
}

/**
 * Decoded contract call data
 */
export interface ContractCallData {
  type: 'contract';
  palletIndex: number;
  callIndex: number;
  contractAddress: string;
  value: string;
  gasLimit: string;
  storageDepositLimit: string | null;
  selector: string;
}

export type DecodedCallData = RuntimeCallData | ContractCallData;

/**
 * Minimum byte length for contract call data
 * pallet(1) + call(1) + address(32) + value(16) + gas(8) + storage(17 with option) + selector(4) = ~79 bytes minimum
 */
const MIN_CONTRACT_CALL_LENGTH = 70;

/**
 * Encodes a runtime/extrinsic call as hex string
 * Format: [pallet_index, call_index]
 *
 * @param palletIndex - Target pallet index (0-255)
 * @param callIndex - Call index within the pallet (0-255)
 * @returns Hex string with 0x prefix
 */
export function encodeRuntimeCall(palletIndex: number, callIndex: number): string {
  if (palletIndex < 0 || palletIndex > 255) {
    throw new Error('Pallet index must be between 0 and 255');
  }
  if (callIndex < 0 || callIndex > 255) {
    throw new Error('Call index must be between 0 and 255');
  }

  return '0x' + palletIndex.toString(16).padStart(2, '0') + callIndex.toString(16).padStart(2, '0');
}

/**
 * Encodes a contract call as hex string
 * Format: (pallet_index, call_index, dest, value, gas_limit, storage_deposit_limit, selector)
 *
 * This creates a SCALE-encoded representation that the target chain will decode.
 *
 * @param palletIndex - Contracts/Revive pallet index
 * @param callIndex - Call dispatchable index within contracts pallet
 * @param contractAddress - Target contract's SS58 address
 * @param value - Balance to send (as string, typically "0")
 * @param gasLimit - Gas allocation for execution (as string)
 * @param storageDepositLimit - Max storage deposit (as string, or null for None)
 * @param selector - Function selector (4 bytes hex with 0x prefix)
 * @returns Hex string with 0x prefix
 */
export function encodeContractCall(
  palletIndex: number,
  callIndex: number,
  contractAddress: string,
  value: string,
  gasLimit: string,
  storageDepositLimit: string | null,
  selector: string
): string {
  if (palletIndex < 0 || palletIndex > 255) {
    throw new Error('Pallet index must be between 0 and 255');
  }
  if (callIndex < 0 || callIndex > 255) {
    throw new Error('Call index must be between 0 and 255');
  }

  // Validate selector format (should be 4 bytes = 8 hex chars)
  const cleanSelector = selector.startsWith('0x') ? selector.slice(2) : selector;
  if (cleanSelector.length !== 8) {
    throw new Error('Selector must be 4 bytes (8 hex characters)');
  }

  const bytes: number[] = [];

  // 1. Pallet index (u8)
  bytes.push(palletIndex);

  // 2. Call index (u8)
  bytes.push(callIndex);

  // 3. Contract address (AccountId32 - 32 bytes)
  const addressBytes = decodeAddress(contractAddress);
  bytes.push(...Array.from(addressBytes));

  // 4. Value (u128 - 16 bytes, little-endian)
  const valueBytes = encodeU128(value);
  bytes.push(...valueBytes);

  // 5. Gas limit - Weight { ref_time: u64, proof_size: u64 }
  // For simplicity, we encode gas as ref_time with proof_size = 0
  const gasBytes = encodeU64(gasLimit);
  bytes.push(...gasBytes);
  // proof_size = 0
  bytes.push(...encodeU64('0'));

  // 6. Storage deposit limit (Option<u128>)
  if (storageDepositLimit === null || storageDepositLimit === '') {
    // None variant
    bytes.push(0x00);
  } else {
    // Some variant
    bytes.push(0x01);
    const storageBytes = encodeU128(storageDepositLimit);
    bytes.push(...storageBytes);
  }

  // 7. Selector (4 bytes)
  for (let i = 0; i < cleanSelector.length; i += 2) {
    bytes.push(parseInt(cleanSelector.substr(i, 2), 16));
  }

  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Determines if the call data represents a contract call based on its length
 *
 * @param hexData - Hex string call data
 * @returns true if this appears to be a contract call
 */
export function isContractCall(hexData: string): boolean {
  if (!hexData || !hexData.startsWith('0x')) {
    return false;
  }

  const hex = hexData.slice(2);
  const byteLength = hex.length / 2;

  // Simple runtime calls are 2 bytes
  // Contract calls are much longer (70+ bytes)
  return byteLength >= MIN_CONTRACT_CALL_LENGTH;
}

/**
 * Decodes call data hex string to structured data
 *
 * @param hexData - Hex string call data with 0x prefix
 * @returns Decoded call data (runtime or contract)
 */
export function decodeCallData(hexData: string): DecodedCallData {
  if (!hexData || !hexData.startsWith('0x')) {
    return { type: 'runtime', palletIndex: 0, callIndex: 0 };
  }

  const hex = hexData.slice(2);
  const byteLength = hex.length / 2;

  // Extract pallet and call index (first 2 bytes)
  const palletIndex = parseInt(hex.slice(0, 2), 16);
  const callIndex = parseInt(hex.slice(2, 4), 16);

  if (byteLength < MIN_CONTRACT_CALL_LENGTH) {
    // Simple runtime call
    return {
      type: 'runtime',
      palletIndex,
      callIndex,
    };
  }

  // Contract call - decode additional fields
  try {
    let offset = 4; // Start after pallet and call index (2 bytes = 4 hex chars)

    // Contract address (32 bytes = 64 hex chars)
    const addressHex = hex.slice(offset, offset + 64);
    offset += 64;

    // Value (16 bytes = 32 hex chars)
    const valueHex = hex.slice(offset, offset + 32);
    const value = decodeU128(valueHex);
    offset += 32;

    // Gas limit ref_time (8 bytes = 16 hex chars)
    const gasHex = hex.slice(offset, offset + 16);
    const gasLimit = decodeU64(gasHex);
    offset += 16;

    // Gas limit proof_size (8 bytes = 16 hex chars) - skip
    offset += 16;

    // Storage deposit limit (Option<u128>)
    const optionByte = parseInt(hex.slice(offset, offset + 2), 16);
    offset += 2;

    let storageDepositLimit: string | null = null;
    if (optionByte === 0x01) {
      const storageHex = hex.slice(offset, offset + 32);
      storageDepositLimit = decodeU128(storageHex);
      offset += 32;
    }

    // Selector (4 bytes = 8 hex chars)
    const selector = '0x' + hex.slice(offset, offset + 8);

    return {
      type: 'contract',
      palletIndex,
      callIndex,
      contractAddress: '0x' + addressHex,
      value,
      gasLimit,
      storageDepositLimit,
      selector,
    };
  } catch (error) {
    console.error('Failed to decode contract call data:', error);
    // Fall back to runtime call format
    return {
      type: 'runtime',
      palletIndex,
      callIndex,
    };
  }
}

/**
 * Encode a number string as u128 (16 bytes, little-endian)
 */
function encodeU128(value: string): number[] {
  const bytes = new Array(16).fill(0);
  let num = BigInt(value);

  for (let i = 0; i < 16; i++) {
    bytes[i] = Number(num & BigInt(0xff));
    num = num >> BigInt(8);
  }

  return bytes;
}

/**
 * Encode a number string as u64 (8 bytes, little-endian)
 */
function encodeU64(value: string): number[] {
  const bytes = new Array(8).fill(0);
  let num = BigInt(value);

  for (let i = 0; i < 8; i++) {
    bytes[i] = Number(num & BigInt(0xff));
    num = num >> BigInt(8);
  }

  return bytes;
}

/**
 * Decode u128 from hex (little-endian) to string
 */
function decodeU128(hex: string): string {
  let result = BigInt(0);

  for (let i = hex.length - 2; i >= 0; i -= 2) {
    result = (result << BigInt(8)) + BigInt(parseInt(hex.slice(i, i + 2), 16));
  }

  return result.toString();
}

/**
 * Decode u64 from hex (little-endian) to string
 */
function decodeU64(hex: string): string {
  let result = BigInt(0);

  for (let i = hex.length - 2; i >= 0; i -= 2) {
    result = (result << BigInt(8)) + BigInt(parseInt(hex.slice(i, i + 2), 16));
  }

  return result.toString();
}
