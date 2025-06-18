import { createConfig, http, cookieStorage, createStorage } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
// import { sepolia, optimism } from 'wagmi/chains'; // commented out
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors';

// Get WalletConnect Project ID from environment (optional)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [mainnet, base, baseSepolia],
  connectors: [
    // Coinbase Wallet with smart wallet preference
    coinbaseWallet({
      appName: 'Smart Wallet Playground',
      appLogoUrl: '/favicon.ico',
      preference: {
        options: 'smartWalletOnly',
        keysUrl: 'https://keys.coinbase.com/connect',
      },
      version: '4',
    }),
    // Injected wallet (for browser wallets)
    injected(),
    // WalletConnect (only if valid project ID is provided)
    ...(projectId && projectId.trim() !== '' ? [walletConnect({ projectId })] : []),
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

// Re-export commonly used types
export type { Config } from 'wagmi';
export { mainnet, base, baseSepolia } from 'wagmi/chains';
