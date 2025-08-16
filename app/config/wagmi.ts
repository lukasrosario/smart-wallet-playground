import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';

export function createWagmiConfig(options?: { appName?: string; appLogoUrl?: string; walletUrl?: string }) {
  return createConfig({
    chains: [baseSepolia, base, mainnet],
    connectors: [
      baseAccount({
        appName: options?.appName || 'Smart Wallet Playground',
        appLogoUrl: options?.appLogoUrl || '/favicon.ico',
        preference: {
          options: 'smartWalletOnly',
          walletUrl: options?.walletUrl || 'https://keys.coinbase.com/connect',
        },
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
