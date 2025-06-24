'use client';

import { useCallback, useMemo } from 'react';
import {
  useSendTransaction,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWalletClient,
  useAccount,
  useBalance,
} from 'wagmi';
import { parseEther, parseUnits, formatEther, erc20Abi } from 'viem';
import { useWallet } from '../context/WagmiContextProvider';

// USDC contract addresses for different chains
export const USDC_ADDRESSES = {
  1: '0xA0b86a33E6441E14d6D7a8e0Bd8a51F8080AE12B', // Mainnet
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  //11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  //10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
} as const;

export function useWagmiTransactions() {
  const { addLog } = useWallet();
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: address,
  });

  // Transaction hooks
  const { sendTransaction, isPending: isSendingETH, data: ethTxHash, error: ethTxError } = useSendTransaction();

  const { writeContract, isPending: isSendingUSDC, data: usdcTxHash, error: usdcTxError } = useWriteContract();

  // Wait for transaction receipts
  const { data: ethTxReceipt, isLoading: isWaitingForETH } = useWaitForTransactionReceipt({
    hash: ethTxHash,
  });

  const { data: usdcTxReceipt, isLoading: isWaitingForUSDC } = useWaitForTransactionReceipt({
    hash: usdcTxHash,
  });

  // Send ETH transaction
  const sendETH = useCallback(
    async (to: string, amount: string) => {
      try {
        if (!address) {
          throw new Error('Wallet not connected');
        }

        const value = parseEther(amount);
        addLog({ type: 'message', data: `Sending ${amount} ETH to ${to}` });

        sendTransaction({
          to: to as `0x${string}`,
          value,
        });
      } catch (error) {
        addLog({
          type: 'error',
          data: `ETH transaction failed: ${error}`,
        });
        throw error;
      }
    },
    [address, sendTransaction, addLog],
  );

  // Send USDC transaction
  const sendUSDC = useCallback(
    async (to: string, amount: string) => {
      try {
        if (!address || !chainId) {
          throw new Error('Wallet not connected or chain not detected');
        }

        const usdcAddress = USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES];
        if (!usdcAddress) {
          throw new Error(`USDC not supported on chain ${chainId}`);
        }

        // USDC has 6 decimals
        const value = parseUnits(amount, 6);
        addLog({ type: 'message', data: `Sending ${amount} USDC to ${to}` });

        writeContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [to as `0x${string}`, value],
        });
      } catch (error) {
        addLog({
          type: 'error',
          data: `USDC transaction failed: ${error}`,
        });
        throw error;
      }
    },
    [address, chainId, writeContract, addLog],
  );

  // Get USDC balance
  const getUSDCBalance = useCallback(async () => {
    try {
      if (!address || !chainId || !publicClient) {
        return '0';
      }

      const usdcAddress = USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES];
      if (!usdcAddress) {
        return '0';
      }

      const balance = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      // Format from 6 decimals to human readable
      return formatEther(balance * BigInt(10 ** 12)); // Convert 6 decimals to 18 decimals for formatEther
    } catch (error) {
      addLog({
        type: 'error',
        data: `Failed to get USDC balance: ${error}`,
      });
      return '0';
    }
  }, [address, chainId, publicClient, addLog]);

  // Sign message using WAGMI
  const signMessage = useCallback(
    async (message: string) => {
      try {
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        addLog({ type: 'message', data: `Signing message: ${message}` });

        const signature = await walletClient.signMessage({
          message,
        });

        addLog({
          type: 'message',
          data: `Message signed: ${signature}`,
        });

        return signature;
      } catch (error) {
        addLog({
          type: 'error',
          data: `Message signing failed: ${error}`,
        });
        throw error;
      }
    },
    [walletClient, addLog],
  );

  return useMemo(
    () => ({
      // ETH transactions
      sendETH,
      isSendingETH,
      ethTxHash,
      ethTxReceipt,
      isWaitingForETH,
      ethTxError,
      ethBalance: ethBalance ? formatEther(ethBalance.value) : '0',
      refetchEthBalance,

      // USDC transactions
      sendUSDC,
      isSendingUSDC,
      usdcTxHash,
      usdcTxReceipt,
      isWaitingForUSDC,
      usdcTxError,
      getUSDCBalance,

      // Signing
      signMessage,

      // Utils
      currentChain: chainId,
      connectedAddress: address,
      isConnected: !!address,
    }),
    [
      sendETH,
      isSendingETH,
      ethTxHash,
      ethTxReceipt,
      isWaitingForETH,
      ethTxError,
      ethBalance,
      refetchEthBalance,
      sendUSDC,
      isSendingUSDC,
      usdcTxHash,
      usdcTxReceipt,
      isWaitingForUSDC,
      usdcTxError,
      getUSDCBalance,
      signMessage,
      chainId,
      address,
    ],
  );
}
