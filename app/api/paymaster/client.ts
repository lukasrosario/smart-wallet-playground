import { http } from 'viem';
import { createPaymasterClient as viem_createPaymasterClient } from 'viem/account-abstraction';

const CHAIN_ID_TO_PAYMASTER_URL = {
  '0x1': process.env.MAINNET_PAYMASTER_URL,
  '0xa': process.env.OPTIMISM_PAYMASTER_URL,
  '0x2105': process.env.BASE_PAYMASTER_URL,
  '0x14a34': process.env.BASE_SEPOLIA_PAYMASTER_URL,
  '0xaa36a7': process.env.SEPOLIA_PAYMASTER_URL,
} as const;

export function createPaymasterClient(chainId: string) {
  return viem_createPaymasterClient({
    transport: http(CHAIN_ID_TO_PAYMASTER_URL[chainId as keyof typeof CHAIN_ID_TO_PAYMASTER_URL]),
  });
}
