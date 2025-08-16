'use client';

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';

type ConfigContextType = {
  appName: string;
  appLogoUrl: string;
  walletUrl: string;

  stagedAppName: string;
  stagedAppLogoUrl: string;
  stagedWalletUrl: string;

  setStagedAppName: (name: string) => void;
  setStagedAppLogoUrl: (url: string) => void;
  setStagedWalletUrl: (url: string) => void;

  applyChanges: () => void;

  hasPendingChanges: boolean;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

type ConfigProviderProps = {
  children: ReactNode;
};

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [appName, setAppName] = useState('Smart Wallet Playground');
  const [appLogoUrl, setAppLogoUrl] = useState('/favicon.ico');
  const [walletUrl, setWalletUrl] = useState('https://keys.coinbase.com/connect');

  const [stagedAppName, setStagedAppName] = useState('Smart Wallet Playground');
  const [stagedAppLogoUrl, setStagedAppLogoUrl] = useState('/favicon.ico');
  const [stagedWalletUrl, setStagedWalletUrl] = useState('https://keys.coinbase.com/connect');

  const hasPendingChanges =
    stagedAppName !== appName || stagedAppLogoUrl !== appLogoUrl || stagedWalletUrl !== walletUrl;

  const applyChanges = useCallback(() => {
    setAppName(stagedAppName);
    setAppLogoUrl(stagedAppLogoUrl);
    setWalletUrl(stagedWalletUrl);
  }, [stagedAppName, stagedAppLogoUrl, stagedWalletUrl]);

  const contextValue = useMemo(
    () => ({
      appName,
      appLogoUrl,
      walletUrl,
      stagedAppName,
      stagedAppLogoUrl,
      stagedWalletUrl,
      setStagedAppName,
      setStagedAppLogoUrl,
      setStagedWalletUrl,
      applyChanges,
      hasPendingChanges,
    }),
    [
      appName,
      appLogoUrl,
      walletUrl,
      stagedAppName,
      stagedAppLogoUrl,
      stagedWalletUrl,
      setStagedAppName,
      setStagedAppLogoUrl,
      setStagedWalletUrl,
      applyChanges,
      hasPendingChanges,
    ],
  );

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
