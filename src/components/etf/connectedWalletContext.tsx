import { explorerClient } from '@/app/explorerClient';
import { DelayedTransaction } from '@/domain/DelayedTransaction';
import { ExecutedTransaction } from '@/domain/ExecutedTransaction';
import { Randomness } from '@/domain/Randomness';
import { ApiPromise, WsProvider } from '@polkadot/api';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of the context
interface ConnectedWalletContextType {
    signer: any;
    setSigner: React.Dispatch<React.SetStateAction<any>>;
    isConnected: boolean;
    setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
    signerAddress: string;
    setSignerAddress: React.Dispatch<React.SetStateAction<string>>;
    signerBalance: string;
    setSignerBalance: React.Dispatch<React.SetStateAction<string>>;
    latestBlock: number;
    setLatestBlock: React.Dispatch<React.SetStateAction<number>>;
    executedTransactions: ExecutedTransaction[];
    setExecutedTransactions: React.Dispatch<React.SetStateAction<ExecutedTransaction[]>>;
    scheduledTransactions: DelayedTransaction[];
    setScheduledTransactions: React.Dispatch<React.SetStateAction<DelayedTransaction[]>>;
    generatedRandomness: Randomness[];
    setGeneratedRandomness: React.Dispatch<React.SetStateAction<Randomness[]>>;
    epochIndex: number | null;
    setEpochIndex: React.Dispatch<React.SetStateAction<number | null>>;
    sessionProgress: number | null;
    setSessionProgress: React.Dispatch<React.SetStateAction<number | null>>;
    sessionLength: number | null;
    setSessionLength: React.Dispatch<React.SetStateAction<number | null>>;
    eraProgress: number | null;
    setEraProgress: React.Dispatch<React.SetStateAction<number | null>>;
    sessionsPerEra: number | null;
    setSessionsPerEra: React.Dispatch<React.SetStateAction<number | null>>;
}

// Create the context with default values
const ConnectedWalletContext = createContext<ConnectedWalletContextType | undefined>(undefined);

export const NUMBER_BLOCKS_EXECUTED = 250;
export const RAMDOMNESS_SAMPLE = 33;
// Create a provider component
export const ConnectedWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [signer, setSigner] = useState<any>(undefined); // The state variable
    const [isConnected, setIsConnected] = useState(false);
    const [signerAddress, setSignerAddress] = useState<string>("");
    const [signerBalance, setSignerBalance] = useState<string>("");
    const [latestBlock, setLatestBlock] = useState<number>(-1);
    const [executedTransactions, setExecutedTransactions] = useState<ExecutedTransaction[]>([]);
    const [scheduledTransactions, setScheduledTransactions] = useState<DelayedTransaction[]>([]);
    const [generatedRandomness, setGeneratedRandomness] = useState<Randomness[]>([]);
    const [epochIndex, setEpochIndex] = useState<number | null>(null);
    const [sessionProgress, setSessionProgress] = useState<number | null>(null);
    const [sessionLength, setSessionLength] = useState<number | null>(null);
    const [eraProgress, setEraProgress] = useState<number | null>(null);
    const [sessionsPerEra, setSessionsPerEra] = useState<number | null>(null);

    useEffect(() => {

        async function subscribeToLatestBlock() {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_NODE_WS || 'wss://rpc.polkadot.io');
            const api = await ApiPromise.create({ provider: wsProvider });
            await api.isReady;

            // Subscribe to new block headers
            await api.rpc.chain.subscribeNewHeads(async (lastHeader) => {

                // Get the current epoch index
                const epochInfo = await api.query.babe.epochIndex();
                const progress = await api.derive.session.progress();
                // Get session and era progress
                setSessionProgress(progress.sessionProgress.toNumber());
                setSessionLength(progress.sessionLength.toNumber());
                setEraProgress(progress.eraProgress.toNumber());
                setSessionsPerEra(progress.sessionsPerEra.toNumber());
                setEpochIndex(epochInfo.toNumber());
                const blockNumber = lastHeader.number.toNumber();
                const blockHash = lastHeader.hash.toHex();
                setLatestBlock(blockNumber);
                explorerClient.getRandomness(blockNumber, RAMDOMNESS_SAMPLE).then((result) => {
                    setGeneratedRandomness(result);
                });
                explorerClient.queryHistoricalEvents(blockNumber > NUMBER_BLOCKS_EXECUTED ? blockNumber - NUMBER_BLOCKS_EXECUTED : 0, blockNumber).then((result) => {
                    setExecutedTransactions(result);
                });
                explorerClient.getScheduledTransactions().then((result) => {
                    setScheduledTransactions(result);
                });
            });
        }

        subscribeToLatestBlock();

    }, []);

    const contextValue = React.useMemo(() => ({
        signer,
        setSigner,
        isConnected,
        setIsConnected,
        signerAddress,
        setSignerAddress,
        signerBalance,
        setSignerBalance,
        latestBlock,
        setLatestBlock,
        executedTransactions,
        setExecutedTransactions,
        scheduledTransactions,
        setScheduledTransactions,
        generatedRandomness,
        setGeneratedRandomness,
        epochIndex,
        setEpochIndex,
        sessionProgress,
        setSessionProgress,
        sessionLength,
        setSessionLength,
        eraProgress,
        setEraProgress,
        sessionsPerEra,
        setSessionsPerEra,
    }), [
        signer,
        isConnected,
        signerAddress,
        signerBalance,
        latestBlock,
        executedTransactions,
        scheduledTransactions,
        generatedRandomness,
        epochIndex,
        sessionProgress,
        sessionLength,
        eraProgress,
        sessionsPerEra
    ]);

    return (
        <ConnectedWalletContext.Provider value={contextValue}>
            {children}
        </ConnectedWalletContext.Provider>
    );
};

// Custom hook to use the CountContext
export const useConnectedWallet = () => {
    const context = useContext(ConnectedWalletContext);
    if (context === undefined) {
        throw new Error('useConnectedWallet must be used within a ConnectedWalletProvider');
    }
    return context;
};