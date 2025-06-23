import { http } from 'viem';
import { createPaymasterClient as viem_createPaymasterClient } from 'viem/account-abstraction';

const CHAIN_ID_TO_PAYMASTER_URL = {
  // '0xa': process.env.OPTIMISM_PAYMASTER_URL,
  '0x2105': process.env.BASE_PAYMASTER_URL,
  '0x14a34': process.env.BASE_SEPOLIA_PAYMASTER_URL,
  // '0xaa36a7': process.env.SEPOLIA_PAYMASTER_URL,
} as const;

const CHAIN_NAMES = {
  // '0xa': 'Optimism',
  '0x2105': 'Base',
  '0x14a34': 'Base Sepolia',
  // '0xaa36a7': 'Sepolia',
} as const;

export function createPaymasterClient(chainId: string) {
  console.log('=== Creating Paymaster Client ===');
  console.log('Chain ID:', chainId);

  const paymasterUrl = CHAIN_ID_TO_PAYMASTER_URL[chainId as keyof typeof CHAIN_ID_TO_PAYMASTER_URL];
  const chainName = CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES] || `Chain ${chainId}`;

  console.log('Available paymaster URLs:', CHAIN_ID_TO_PAYMASTER_URL);
  console.log('Selected paymaster URL:', paymasterUrl);
  console.log('Chain name:', chainName);

  if (!paymasterUrl) {
    console.error('Paymaster URL not found for chain:', chainId);
    throw new Error(
      `Paymaster URL not configured for ${chainName} (chain ID: ${chainId}). ` +
        `Please set the required environment variable in .env.local file. ` +
        `See WAGMI_IMPLEMENTATION.md for setup instructions.`,
    );
  }

  if (!paymasterUrl.startsWith('https://')) {
    console.error('Invalid paymaster URL format:', paymasterUrl);
    throw new Error(
      `Invalid paymaster URL for ${chainName}: "${paymasterUrl}". ` + `Paymaster URL must be a valid HTTPS URL.`,
    );
  }

  console.log('Creating viem paymaster client with URL:', paymasterUrl);
  return viem_createPaymasterClient({
    transport: http(paymasterUrl),
  });
}
