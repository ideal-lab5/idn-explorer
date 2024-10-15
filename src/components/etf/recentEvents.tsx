import React, { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Badge } from '@/components/badge'
import {
    SidebarItem,
    SidebarLabel
} from '@/components/sidebar'
import { explorerClient } from '@/app/explorerClient';
import { ExecutedTransaction } from '@/domain/ExecutedTransaction';

export const LatestEvents: React.FC = () => {
    const [events, setEvents] = useState<ExecutedTransaction[]>([]);

    useEffect(() => {

        async function subscribeEvents() {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_NODE_WS || 'wss://rpc.polkadot.io');
            const api = await ApiPromise.create({ provider: wsProvider });
            await api.isReady;

            // Subscribe to new block headers
            await api.rpc.chain.subscribeNewHeads(async (lastHeader) => {
                const blockNumber = lastHeader.number.toNumber();
                explorerClient.queryHistoricalEvents(blockNumber, blockNumber).then((result) => {
                    setEvents(result);
                });
            });
        }

        subscribeEvents();

        return () => {
        };
    }, []);

    return (
        <>
            {!events?.length && <SidebarItem><SidebarLabel><Badge color="purple">No events found</Badge></SidebarLabel></SidebarItem>}
            {events.map((event, index) => (
                <SidebarItem href={`/compose/${event.id}_OP_${event.operation}`} key={index}>
                    <SidebarLabel><Badge color="purple">{event.id} {event.operation}</Badge>
                        <p className="text-xs pl-1 truncate">
                            {event?.metadata[0]}</p>
                    </SidebarLabel>
                </SidebarItem>
            ))}
        </>
    );
};
