import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from '@wagmi/connectors';

export function createWagmiConfig(options?: { appName?: string; appLogoUrl?: string; keysUrl?: string }) {
  return createConfig({
    chains: [mainnet, base, baseSepolia],
    connectors: [
      coinbaseWallet({
        appName: options?.appName || 'Smart Wallet Playground',
        appLogoUrl: options?.appLogoUrl || '/favicon.ico',
        preference: {
          options: 'smartWalletOnly',
          keysUrl: options?.keysUrl || 'https://keys.coinbase.com/connect',
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
}

// Default static config for backwards compatibility
export const wagmiConfig = createWagmiConfig();

export type { Config } from 'wagmi';
export { mainnet, base, baseSepolia } from 'wagmi/chains';
