'use client';

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';

type ConfigContextType = {
  appName: string;
  appLogoUrl: string;
  keysUrl: string;

  stagedAppName: string;
  stagedAppLogoUrl: string;
  stagedKeysUrl: string;

  setStagedAppName: (name: string) => void;
  setStagedAppLogoUrl: (url: string) => void;
  setStagedKeysUrl: (url: string) => void;

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
  const [keysUrl, setKeysUrl] = useState('https://keys.coinbase.com/connect');

  const [stagedAppName, setStagedAppName] = useState('Smart Wallet Playground');
  const [stagedAppLogoUrl, setStagedAppLogoUrl] = useState('/favicon.ico');
  const [stagedKeysUrl, setStagedKeysUrl] = useState('https://keys.coinbase.com/connect');

  const hasPendingChanges = stagedAppName !== appName || stagedAppLogoUrl !== appLogoUrl || stagedKeysUrl !== keysUrl;

  const applyChanges = useCallback(() => {
    setAppName(stagedAppName);
    setAppLogoUrl(stagedAppLogoUrl);
    setKeysUrl(stagedKeysUrl);
  }, [stagedAppName, stagedAppLogoUrl, stagedKeysUrl]);

  const contextValue = useMemo(
    () => ({
      appName,
      appLogoUrl,
      keysUrl,
      stagedAppName,
      stagedAppLogoUrl,
      stagedKeysUrl,
      setStagedAppName,
      setStagedAppLogoUrl,
      setStagedKeysUrl,
      applyChanges,
      hasPendingChanges,
    }),
    [
      appName,
      appLogoUrl,
      keysUrl,
      stagedAppName,
      stagedAppLogoUrl,
      stagedKeysUrl,
      setStagedAppName,
      setStagedAppLogoUrl,
      setStagedKeysUrl,
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
