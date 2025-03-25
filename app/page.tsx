'use client';

import { ConnectWallet } from './components/ConnectWallet';
import { EventLog } from './components/EventLog';
import { SDKConfig } from './components/SDKConfig';
import { ChainConfig } from './components/ChainConfig';
import { WalletProvider } from './context/WalletContext';
import { ConfigProvider } from './context/ConfigContext';
import { SendUSDC } from './components/SendUSDC';
import { SendETH } from './components/SendETH';

export default function Home() {
  return (
    <ConfigProvider>
      <WalletProvider>
        <div className="flex flex-col p-4 md:p-16 space-y-8">
          <ConnectWallet />
          <EventLog />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SDKConfig />
            <ChainConfig />
            <SendUSDC />
            <SendETH />
          </div>
        </div>
      </WalletProvider>
    </ConfigProvider>
  );
}
