'use client';

import { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { WagmiProvider, useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWagmiConfig } from '../config/wagmi';
import { useConfig } from './ConfigContext';

export type EventLog = {
  type: 'connect' | 'disconnect' | 'accountsChanged' | 'chainChanged' | 'message' | 'error';
  timestamp: number;
  data:
    | string // For 'message' and 'chainChanged' types
    | Error // For 'error' type
    | unknown // For 'error' type when error is unknown
    | { chainId: string } // For 'connect' type
    | string[] // For 'accountsChanged' type
    | { code: number; message: string }; // For 'disconnect' type
};

type WAGMIContextType = {
  isConnected: boolean;
  connectedAddress: string | undefined;
  currentChain: string | undefined;
  addLog: (log: Omit<EventLog, 'timestamp'>) => void;
  clearLogs: () => void;
  eventLogs: EventLog[];
};

const WAGMIContext = createContext<WAGMIContextType | undefined>(undefined);

// Create QueryClient outside component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function WAGMIContextProvider({ children }: { children: React.ReactNode }) {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const { address: connectedAddress, chainId } = useAccount();

  const addLog = useCallback((log: Omit<EventLog, 'timestamp'>) => {
    setEventLogs((prev) => [...prev, { ...log, timestamp: Date.now() }]);
  }, []);

  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Convert chainId to hex string to match legacy format
  const currentChain = chainId ? `0x${chainId.toString(16)}` : undefined;
  const isConnected = !!connectedAddress;

  // Auto-log connection events to match production behavior
  useEffect(() => {
    if (isConnected && connectedAddress && currentChain) {
      addLog({
        type: 'connect',
        data: { chainId: currentChain },
      });
      addLog({
        type: 'accountsChanged',
        data: [connectedAddress],
      });
    }
  }, [isConnected, connectedAddress, currentChain, addLog]);

  // Auto-log chain changes
  useEffect(() => {
    if (isConnected && currentChain) {
      addLog({
        type: 'chainChanged',
        data: currentChain,
      });
    }
  }, [currentChain, isConnected, addLog]);

  // Track previous connection state to log disconnect only once
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setWasConnected(true);
    } else if (wasConnected && !isConnected) {
      // Only log disconnect if we were previously connected
      addLog({
        type: 'disconnect',
        data: { code: 4900, message: 'User disconnected' },
      });
      setWasConnected(false);
    }
  }, [isConnected, wasConnected, addLog]);

  const value = useMemo(
    () => ({
      isConnected,
      connectedAddress,
      currentChain,
      addLog,
      clearLogs,
      eventLogs,
    }),
    [isConnected, connectedAddress, currentChain, addLog, clearLogs, eventLogs],
  );

  return <WAGMIContext.Provider value={value}>{children}</WAGMIContext.Provider>;
}

export function WAGMIProvider({ children }: { children: React.ReactNode }) {
  const { appName, appLogoUrl, keysUrl } = useConfig();

  // Recreate config when any parameter changes
  // This will cause reconnection, but it's the only way to update connector metadata
  const wagmiConfig = useMemo(() => {
    console.log('Creating WAGMI config with:', { appName, appLogoUrl, keysUrl });
    return createWagmiConfig({ appName, appLogoUrl, keysUrl });
  }, [appName, appLogoUrl, keysUrl]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <WAGMIContextProvider>{children}</WAGMIContextProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export function useWallet() {
  const context = useContext(WAGMIContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WAGMIProvider');
  }
  return context;
}
