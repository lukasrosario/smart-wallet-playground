'use client';

import { ConnectWallet } from './components/ConnectWallet';
import { EventLog } from './components/EventLog';
import { SDKConfig } from './components/SDKConfig';
import { ChainConfig } from './components/ChainConfig';
import { WalletProvider } from './context/WalletContext';
import { ConfigProvider } from './context/ConfigContext';
import { SendUSDC } from './components/SendUSDC';
import { SendETH } from './components/SendETH';
import { AppPaymaster } from './components/AppPaymaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <WalletProvider>
          <div className="flex flex-col p-4 md:p-16 md:pt-12 space-y-8 max-w-9xl mx-auto">
            <ConnectWallet />
            <EventLog />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SDKConfig />
              <ChainConfig />
              <SendUSDC />
              <SendETH />
              <AppPaymaster />
            </div>
          </div>
        </WalletProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
