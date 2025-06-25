'use client';

import { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { WagmiProvider, useAccount, useChainId } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../config/wagmi';

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

type LogContextType = {
  addLog: (log: Omit<EventLog, 'timestamp'>) => void;
  clearLogs: () => void;
  eventLogs: EventLog[];
};

const LogContext = createContext<LogContextType | undefined>(undefined);

// Create QueryClient outside component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function LogContextProvider({ children }: { children: React.ReactNode }) {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();

  const addLog = useCallback((log: Omit<EventLog, 'timestamp'>) => {
    setEventLogs((prev) => [...prev, { ...log, timestamp: Date.now() }]);
  }, []);

  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Convert chainId to hex string for logging
  const currentChain = chainId ? `0x${chainId.toString(16)}` : undefined;

  // Auto-log connection events
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

  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setWasConnected(true);
    } else if (wasConnected && !isConnected) {
      addLog({
        type: 'disconnect',
        data: { code: 4900, message: 'User disconnected' },
      });
      setWasConnected(false);
    }
  }, [isConnected, wasConnected, addLog]);

  const value = useMemo(
    () => ({
      addLog,
      clearLogs,
      eventLogs,
    }),
    [addLog, clearLogs, eventLogs],
  );

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
}

export function WAGMIProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <LogContextProvider>{children}</LogContextProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export function useWallet() {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WAGMIProvider');
  }
  return context;
}
