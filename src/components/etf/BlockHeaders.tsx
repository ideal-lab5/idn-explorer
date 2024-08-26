import React, { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Badge } from '@/components/badge'
import {
    SidebarItem,
    SidebarLabel
} from '@/components/sidebar'
import { formatNumber } from '@polkadot/util';

interface BlockHeader {
    blockNumber: number;
    blockHash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
}

export const BlockHeaders: React.FC = () => {
    const [headers, setHeaders] = useState<BlockHeader[]>([]);

    useEffect(() => {
        let unsubscribe: () => void;

        async function subscribeHeaders() {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_CHAIN_URL || 'wss://rpc.polkadot.io');
            const api = await ApiPromise.create({ provider: wsProvider });

            unsubscribe = await api.rpc.chain.subscribeNewHeads((lastHeader) => {
                setHeaders((prevHeaders) => {
                    const newHeader: BlockHeader = {
                        blockNumber: lastHeader.number.toNumber(),
                        blockHash: lastHeader.hash.toHex(),
                        parentHash: lastHeader.parentHash.toHex(),
                        stateRoot: lastHeader.stateRoot.toHex(),
                        extrinsicsRoot: lastHeader.extrinsicsRoot.toHex(),
                    };

                    // Filter out duplicates based on block number
                    const filteredHeaders = prevHeaders.filter(
                        (header) => header.blockNumber !== newHeader.blockNumber
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
            {!headers?.length && <SidebarItem><SidebarLabel><Badge color="lime">Loading recent blocks...</Badge></SidebarLabel></SidebarItem>}
            {headers.map((header, index) => (
                <SidebarItem href={"#"} key={index}>
                    <SidebarLabel><Badge color="lime">{formatNumber(header.blockNumber)}</Badge> </SidebarLabel>
                    <SidebarLabel className="text-xs pl-1 truncate">{`${formatHash(header.blockHash)}`}</SidebarLabel>
                </SidebarItem>
            ))}
        </>
    );
};
