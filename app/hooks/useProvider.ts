import { createCoinbaseWalletSDK, ProviderInterface } from '@coinbase/wallet-sdk';
import { useCallback, useEffect, useState } from 'react';

type UseProviderProps = {
  appName?: string;
  appLogoUrl?: string;
  keysUrl?: string;
};

type ConnectInfo = {
  chainId: string;
};

type DisconnectError = {
  code: number;
  message: string;
};

export type EventLog = {
  type: 'connect' | 'disconnect' | 'accountsChanged' | 'chainChanged' | 'message' | 'error';
  timestamp: number;
  data: ConnectInfo | DisconnectError | string[] | string | unknown;
};

export function useProvider({ appName, appLogoUrl, keysUrl }: UseProviderProps = {}) {
  const [provider, setProvider] = useState<ProviderInterface | undefined>(undefined);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [currentChain, setCurrentChain] = useState<string | undefined>(undefined);

  const addLog = useCallback((log: Omit<EventLog, 'timestamp'>) => {
    setEventLogs((prev) => [...prev, { ...log, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    const sdk = createCoinbaseWalletSDK({
      preference: {
        options: 'smartWalletOnly',
        keysUrl: keysUrl === '' ? 'https://keys.coinbase.com/connect' : keysUrl,
      },
      appName: appName === '' ? 'Smart Wallet Playground' : appName,
      appLogoUrl: appLogoUrl,
    });

    const provider = sdk.getProvider();
    setProvider(provider);

    if (provider) {
      provider.on('connect', (info: ConnectInfo) => {
        setCurrentChain(info.chainId);
        addLog({ type: 'connect', data: info });
      });

      provider.on('disconnect', (error: DisconnectError) => {
        setCurrentChain(undefined);
        addLog({
          type: 'disconnect',
          data: { code: error.code, message: error.message },
        });
      });

      provider.on('accountsChanged', (accounts: string[]) => {
        addLog({ type: 'accountsChanged', data: accounts });
      });

      provider.on('chainChanged', (chainId: string) => {
        setCurrentChain(chainId);
        addLog({ type: 'chainChanged', data: chainId });
      });
    }

    return () => {
      if (provider) {
        provider.removeListener('connect', () => {});
        provider.removeListener('disconnect', () => {});
        provider.removeListener('accountsChanged', () => {});
        provider.removeListener('chainChanged', () => {});
      }
    };
  }, [appName, appLogoUrl, keysUrl, addLog]);

  return { provider, eventLogs, addLog, currentChain };
}
