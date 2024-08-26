import React, { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { EventRecord } from '@polkadot/types/interfaces';
import { Badge } from '@/components/badge'
import {
    SidebarItem,
    SidebarLabel
} from '@/components/sidebar'

interface BlockchainEvent {
    blockNumber: number;
    event: string;
    meta: string[];
    section: string;
    method: string;
    data: string[];
}

export const LatestEvents: React.FC = () => {
    const [events, setEvents] = useState<BlockchainEvent[]>([]);

    useEffect(() => {
        let unsubscribe: () => void;

        async function subscribeEvents() {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_CHAIN_URL || 'wss://rpc.polkadot.io');
            const api = await ApiPromise.create({ provider: wsProvider });

            // Get the current block number from the chain
            const latestHeader = await api.rpc.chain.getHeader();
            let currentBlockNumber = latestHeader.number.toNumber();

            unsubscribe = api.query.system.events((records: EventRecord[]) => {

                setEvents((prevEvents) => {
                    // Extracting event details
                    const newEvents: BlockchainEvent[] = records.map(({ event }) => {
                        const { section, method } = event;

                        return {
                            blockNumber: currentBlockNumber,
                            event: event.toString(),
                            section,
                            meta: event.meta.docs.map((d) => d.toString().trim()),
                            method,
                            index: event.index,
                            data: event.data.map((data) => data.toString()),
                        };
                    }).filter(({ method, section }) =>
                        section !== 'system' &&
                        (
                            !['balances', 'treasury'].includes(section) ||
                            !['Deposit', 'UpdatedInactive', 'Withdraw'].includes(method)
                        ) &&
                        (
                            !['transactionPayment'].includes(section) ||
                            !['TransactionFeePaid'].includes(method)
                        ) &&
                        (
                            !['paraInclusion', 'parasInclusion', 'inclusion'].includes(section) ||
                            !['CandidateBacked', 'CandidateIncluded'].includes(method)
                        ) &&
                        (
                            !['relayChainInfo'].includes(section) ||
                            !['CurrentBlockNumbers'].includes(method)
                        )
                    ).reverse();

                    // Combine new events with previous events and remove duplicates
                    const updatedEvents = [...newEvents, ...prevEvents];
                    // .filter((v, i, a) => a.findIndex(t => (t.blockNumber === v.blockNumber && t.event === v.event)) === i)
                    // .sort((a, b) => b.blockNumber - a.blockNumber);

                    // Keep only the most recent 5 events
                    return updatedEvents.slice(0, 5);
                });

                // Update block number for the next set of events
                currentBlockNumber += 1;
            });
        }


        subscribeEvents();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return (
        <>
            {!events?.length && <SidebarItem><SidebarLabel><Badge color="purple">No events found</Badge></SidebarLabel></SidebarItem>}
            {events.map((event, index) => (
                <SidebarItem href={`/compose/${event.blockNumber}`} key={index}>
                    <SidebarLabel><Badge color="purple">{event.section}.{event.method}</Badge>
                        <p className="text-xs pl-1 truncate">
                            {event.meta[0]}</p>
                    </SidebarLabel>
                </SidebarItem>
            ))}
        </>
    );
};
