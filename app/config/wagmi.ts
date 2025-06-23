import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from '@wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [mainnet, base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Smart Wallet Playground',
      appLogoUrl: '/favicon.ico',
      preference: {
        options: 'smartWalletOnly',
        keysUrl: 'https://keys.coinbase.com/connect',
      },
      version: '4',
    }),
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

export type { Config } from 'wagmi';
export { mainnet, base, baseSepolia } from 'wagmi/chains';
