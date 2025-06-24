'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type ConfigContextType = {
  appName: string;
  appLogoUrl: string;
  keysUrl: string;
  setAppName: (name: string) => void;
  setAppLogoUrl: (url: string) => void;
  setKeysUrl: (url: string) => void;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

type ConfigProviderProps = {
  children: ReactNode;
};

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [appName, setAppName] = useState('');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [keysUrl, setKeysUrl] = useState('');

  return (
    <ConfigContext.Provider value={{ appName, appLogoUrl, keysUrl, setAppName, setAppLogoUrl, setKeysUrl }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
