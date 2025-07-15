'use client';

import { explorerClient } from '@/lib/explorer-client';
import { DelayedTransaction } from '@/domain/DelayedTransaction';
import { ExecutedTransaction } from '@/domain/ExecutedTransaction';
import { Randomness } from '@/domain/Randomness';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePolkadot } from '@/components/contexts/polkadotContext';
import { container } from 'tsyringe';
import { IChainStateService } from '@/services/IChainStateService';

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
    sessionIndex: number | null;
    setSessionIndex: React.Dispatch<React.SetStateAction<number | null>>;
    sessionProgress: number | null;
    setSessionProgress: React.Dispatch<React.SetStateAction<number | null>>;
    sessionLength: number | null;
    setSessionLength: React.Dispatch<React.SetStateAction<number | null>>;
    eraProgress: number | null;
    setEraProgress: React.Dispatch<React.SetStateAction<number | null>>;
    sessionsPerEra: number | null;
    setSessionsPerEra: React.Dispatch<React.SetStateAction<number | null>>;
    delayedOnly: boolean;
    setDelayedOnly: React.Dispatch<React.SetStateAction<boolean>>;
    composeCurrentSelection: string;
    setComposeCurrentSelection: React.Dispatch<React.SetStateAction<string>>;
    composeCurrentSearchTerm: string;
    setComposeCurrentSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    searchTermExecuted: string;
    setSearchTermExecuted: React.Dispatch<React.SetStateAction<string>>;
    searchTermScheduled: string;
    setSearchTermScheduled: React.Dispatch<React.SetStateAction<string>>;
}

// Create the context with default values
const ConnectedWalletContext = createContext<ConnectedWalletContextType | undefined>(undefined);

export const NUMBER_BLOCKS_EXECUTED = 50;
export const RAMDOMNESS_SAMPLE = 33;
// Create a provider component
export const ConnectedWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { polkadotApiService } = usePolkadot();
    const chainStateService = container.resolve<IChainStateService>('IChainStateService');
    const [isReady, setIsReady] = useState(false);
    const [signer, setSigner] = useState<any>(undefined); // The state variable
    const [isConnected, setIsConnected] = useState(false);
    const [signerAddress, setSignerAddress] = useState<string>("");
    const [signerBalance, setSignerBalance] = useState<string>("");
    const [latestBlock, setLatestBlock] = useState<number>(-1);
    const [executedTransactions, setExecutedTransactions] = useState<ExecutedTransaction[]>([]);
    const [scheduledTransactions, setScheduledTransactions] = useState<DelayedTransaction[]>([]);
    const [generatedRandomness, setGeneratedRandomness] = useState<Randomness[]>([]);
    const [sessionIndex, setSessionIndex] = useState<number | null>(null);
    const [sessionProgress, setSessionProgress] = useState<number | null>(null);
    const [sessionLength, setSessionLength] = useState<number | null>(null);
    const [eraProgress, setEraProgress] = useState<number | null>(null);
    const [sessionsPerEra, setSessionsPerEra] = useState<number | null>(null);
    const [delayedOnly, setDelayedOnly] = useState(false); // To indicate if only show delayed txs
    const [composeCurrentSelection, setComposeCurrentSelection] = useState<string>("scheduled");
    const [composeCurrentSearchTerm, setComposeCurrentSearchTerm] = useState<string>("");
    const [searchTermExecuted, setSearchTermExecuted] = useState<string>("");
    const [searchTermScheduled, setSearchTermScheduled] = useState<string>("");

    useEffect(() => {
        const checkApiReady = async () => {
            const ready = await polkadotApiService.isReady();
            setIsReady(ready);
        };
        checkApiReady();
    }, [polkadotApiService]);

    useEffect(() => {
        if (!isReady) return;

        let unsubscribe: (() => void) | undefined;

        const subscribeToUpdates = async () => {
            try {
                unsubscribe = await chainStateService.subscribeToBlocks((blockNumber) => {
                    setLatestBlock(blockNumber);
                    // Update other state based on new blocks
                    if (signerAddress) {
                        chainStateService.getBalance(signerAddress)
                            .then(balance => setSignerBalance(balance))
                            .catch(console.error);
                    }

                    // Get session and era progress
                    Promise.all([
                        chainStateService.getSessionInfo(),
                        chainStateService.getSessionIndex(),
                        explorerClient?.getScheduledTransactions(),
                        explorerClient?.queryHistoricalEvents(
                            blockNumber > NUMBER_BLOCKS_EXECUTED ? 
                            blockNumber - NUMBER_BLOCKS_EXECUTED : 0, 
                            blockNumber
                        ),
                        explorerClient?.getRandomness(blockNumber, RAMDOMNESS_SAMPLE)
                    ]).then(([
                        sessionInfo,
                        sessionIndex,
                        scheduled,
                        executed,
                        randomness
                    ]) => {
                        setSessionProgress(sessionInfo.sessionProgress);
                        setSessionLength(sessionInfo.sessionLength);
                        setEraProgress(sessionInfo.eraProgress);
                        setSessionsPerEra(sessionInfo.sessionsPerEra);
                        setSessionIndex(sessionIndex);
                        setScheduledTransactions(scheduled || []);
                        setExecutedTransactions(executed || []);
                        setGeneratedRandomness(randomness || []);
                    }).catch(console.error);
                });
            } catch (error) {
                console.error('Failed to subscribe to updates:', error);
            }
        };

        subscribeToUpdates();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isReady, signerAddress]);

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
        sessionIndex,
        setSessionIndex,
        sessionProgress,
        setSessionProgress,
        sessionLength,
        setSessionLength,
        eraProgress,
        setEraProgress,
        sessionsPerEra,
        setSessionsPerEra,
        delayedOnly,
        setDelayedOnly,
        composeCurrentSelection,
        setComposeCurrentSelection,
        composeCurrentSearchTerm,
        setComposeCurrentSearchTerm,
        searchTermExecuted,
        setSearchTermExecuted,
        searchTermScheduled,
        setSearchTermScheduled
    }), [
        signer,
        isConnected,
        signerAddress,
        signerBalance,
        latestBlock,
        executedTransactions,
        scheduledTransactions,
        generatedRandomness,
        sessionIndex,
        sessionProgress,
        sessionLength,
        eraProgress,
        sessionsPerEra,
        delayedOnly,
        composeCurrentSelection,
        composeCurrentSearchTerm,
        searchTermExecuted,
        searchTermScheduled
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