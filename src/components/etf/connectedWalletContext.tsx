import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

// Create the context with default values
const ConnectedWalletContext = createContext<ConnectedWalletContextType | undefined>(undefined);

// Create a provider component
export const ConnectedWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [signer, setSigner] = useState<any>(undefined); // The state variable
    const [isConnected, setIsConnected] = useState(false);
    const [signerAddress, setSignerAddress] = useState<string>("");
    const [signerBalance, setSignerBalance] = useState<string>("");
    const [latestBlock, setLatestBlock] = useState<number>(-1);

    return (
        <ConnectedWalletContext.Provider
            value={{
                signer,
                setSigner,
                isConnected,
                setIsConnected,
                signerAddress,
                setSignerAddress,
                signerBalance,
                setSignerBalance,
                latestBlock,
                setLatestBlock
            }}
        >
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