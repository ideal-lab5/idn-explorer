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

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/badge'
import {
    SidebarItem,
    SidebarLabel
} from '@/components/sidebar'
import { ExecutedTransaction } from '@/domain/ExecutedTransaction';
import { container } from 'tsyringe';
import { IChainStateService } from '@/services/IChainStateService';
import { explorerClient } from '@/lib/explorer-client';

export default function LatestEvents() {
    const [events, setEvents] = useState<ExecutedTransaction[]>([]);
    const chainStateService = container.resolve<IChainStateService>('IChainStateService');

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const subscribeToBlocks = async () => {
            unsubscribe = await chainStateService.subscribeToBlocks(async (blockNumber) => {
                if (explorerClient) {
                    const result = await explorerClient.queryHistoricalEvents(blockNumber, blockNumber);
                    setEvents(result);
                } else {
                    console.error('Explorer client is not initialized');
                }
            });
        };

        subscribeToBlocks().catch(console.error);

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [chainStateService]);

    return (
        <>
            {!events?.length && <SidebarItem><SidebarLabel><Badge color="purple">No events found</Badge></SidebarLabel></SidebarItem>}
            {events.map((event, index) => (
                <SidebarItem href={`/timelock/${event.id}_OP_${event.operation}`} key={index}>
                    <SidebarLabel><Badge color="purple">{event.id} {event.operation}</Badge>
                        <p className="text-xs pl-1 truncate">
                            {event?.metadata[0]}</p>
                    </SidebarLabel>
                </SidebarItem>
            ))}
        </>
    );
};
