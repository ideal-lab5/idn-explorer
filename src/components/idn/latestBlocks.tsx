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

import { Badge } from '@/components/badge';
import { SidebarItem, SidebarLabel } from '@/components/sidebar';
import { ChainStateService } from '@/services/ChainStateService';
import type { BlockHeader } from '@/services/IChainStateService';
import { formatNumber } from '@polkadot/util';
import React, { useEffect, useState } from 'react';
import { container } from 'tsyringe';

export const BlockHeaders: React.FC = () => {
  const [headers, setHeaders] = useState<BlockHeader[]>([]);
  const chainStateService = container.resolve(ChainStateService);

  useEffect(() => {
    let unsubscribe: () => void;

    async function subscribeHeaders() {
      unsubscribe = await chainStateService.subscribeToNewHeaders(newHeader => {
        setHeaders(prevHeaders => {
          // Filter out duplicates based on block number
          const filteredHeaders = prevHeaders.filter(
            header => header.blockNumber !== newHeader.blockNumber
          );

          // Add the new header and sort by block number in descending order
          const updatedHeaders = [newHeader, ...filteredHeaders].sort(
            (a, b) => b.blockNumber - a.blockNumber
          );

          // Keep only the most recent 5 headers
          return updatedHeaders.slice(0, 5);
        });
      });
    }

    subscribeHeaders();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Helper function to format the blockHash
  const formatHash = (hash: string) => {
    const start = hash.slice(0, 6);
    const end = hash.slice(-6);
    return `${start}...${end}`;
  };

  return (
    <>
      {!headers?.length && (
        <SidebarItem>
          <SidebarLabel>
            <Badge color="lime">Loading recent blocks...</Badge>
          </SidebarLabel>
        </SidebarItem>
      )}
      {headers.map((header, index) => (
        <SidebarItem key={index}>
          <SidebarLabel>
            <Badge color="lime">{formatNumber(header.blockNumber)}</Badge>{' '}
          </SidebarLabel>
          <SidebarLabel className="truncate pl-1 text-xs">{`${formatHash(header.blockHash)}`}</SidebarLabel>
        </SidebarItem>
      ))}
    </>
  );
};
