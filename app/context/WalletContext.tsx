import { createContext, useContext, type ReactNode } from 'react';
import type { ProviderInterface } from '@coinbase/wallet-sdk';
import { useProvider } from '../hooks/useProvider';
import type { EventLog } from '../hooks/useProvider';
import { useConfig } from './ConfigContext';

type WalletContextType = {
  provider: ProviderInterface | undefined;
  eventLogs: EventLog[];
  addLog: (log: Omit<EventLog, 'timestamp'>) => void;
  clearLogs: () => void;
  currentChain: string | undefined;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

type WalletProviderProps = {
  children: ReactNode;
};

export function WalletProvider({ children }: WalletProviderProps) {
  const { appName, appLogoUrl, keysUrl } = useConfig();
  const { provider, eventLogs, addLog, clearLogs, currentChain } = useProvider({ appName, appLogoUrl, keysUrl });

  return (
    <WalletContext.Provider value={{ provider, eventLogs, addLog, clearLogs, currentChain }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
