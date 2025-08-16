import { createBaseAccountSDK } from '@base-org/account';
import { requestSpendPermission, prepareSpendCallData } from '@base-org/account/spend-permission';
import { useCallback, useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { numberToHex, parseEther, formatEther } from 'viem';
import { FeatureLayout } from './ui/FeatureLayout';
import { ConnectWalletPrompt } from './ui/ConnectWalletPrompt';
import { Button } from './ui/Button';
import { useAccount } from 'wagmi';
import { useHydration } from '../hooks/useHydration';
import { useWallet } from '../context/WagmiContextProvider';

// Constants for spend permissions
const SPEND_ALLOWANCE = parseEther('0.01'); // 0.01 ETH allowance
const TRANSACTION_AMOUNT = parseEther('0.001'); // 0.001 ETH per transaction
const SPEND_PERIOD_DAYS = 30; // 30 day period
const ETH_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // ERC-7528 native token

type SubAccount = {
  address: `0x${string}`;
  factory?: `0x${string}`;
  factoryData?: `0x${string}`;
};

type WalletAddSubAccountResponse = {
  address: `0x${string}`;
  factory?: `0x${string}`;
  factoryData?: `0x${string}`;
};

export function SubAccountManager() {
  const { addLog } = useWallet();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isHydrated = useHydration();

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;

  const [provider, setProvider] = useState<ReturnType<ReturnType<typeof createBaseAccountSDK>['getProvider']> | null>(
    null,
  );
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null);
  const [spendPermission, setSpendPermission] = useState<unknown | null>(null);
  const [loadingSubAccount, setLoadingSubAccount] = useState(false);
  const [loadingSpendPermission, setLoadingSpendPermission] = useState(false);
  const [status, setStatus] = useState('');

  // Use dynamic values from global state
  const universalAddress = address || '';
  const connected = displayIsConnected;

  // Initialize SDK and reinitialize when chain changes
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setProvider(null);

        const sdkInstance = createBaseAccountSDK({
          appName: 'Sub Account Demo',
          appLogoUrl: 'https://base.org/logo.png',
          appChainIds: [chainId],
        });

        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);

        setStatus(`SDK initialized for chain ${chainId} - ${connected ? 'connected' : 'ready to connect'}`);
      } catch {
        setStatus('SDK initialization failed');
      }
    };

    initializeSDK();
  }, [chainId, connected]);

  // Update status when connection state changes
  useEffect(() => {
    if (connected && universalAddress) {
      setStatus(`Ready to create sub account for chain ${chainId}`);
    }
  }, [connected, universalAddress, chainId]);

  // Log status updates to event log
  useEffect(() => {
    if (status) {
      addLog({
        type: status.includes('failed') || status.includes('❌') ? 'error' : 'message',
        data: status,
      });
    }
  }, [status, addLog]);

  const createSubAccount = async () => {
    if (!provider) {
      setStatus('Provider not initialized');
      return;
    }

    setLoadingSubAccount(true);
    setStatus('Creating Sub Account...');

    try {
      // First, ensure we're connected by requesting accounts
      await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });

      const newSubAccount = (await provider.request({
        method: 'wallet_addSubAccount',
        params: [
          {
            account: {
              type: 'create',
            },
          },
        ],
      })) as WalletAddSubAccountResponse;

      setSubAccount(newSubAccount);
      setStatus(`Sub Account created successfully for chain ${chainId}!`);

      addLog({
        type: 'message',
        data: `Sub Account created: ${newSubAccount.address} on chain ${chainId}`,
      });
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';

      if (errorMessage.includes('passkey_public_key') || errorMessage.includes('mismatched')) {
        setStatus(
          `❌ Passkey mismatch during creation. This might be a Base Account SDK issue. Try switching to a different chain and back.`,
        );
      } else {
        setStatus(`Sub Account creation failed: ${errorMessage}`);
      }
    } finally {
      setLoadingSubAccount(false);
    }
  };

  const createNewSubAccountForCurrentChain = async () => {
    if (!provider) {
      setStatus('Provider not initialized');
      return;
    }

    setLoadingSubAccount(true);
    setStatus(`Creating new Sub Account for chain ${chainId}...`);

    try {
      setSubAccount(null);

      // First, ensure we're connected by requesting accounts
      await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });

      const newSubAccount = (await provider.request({
        method: 'wallet_addSubAccount',
        params: [
          {
            account: {
              type: 'create',
            },
          },
        ],
      })) as WalletAddSubAccountResponse;

      setSubAccount(newSubAccount);
      setStatus(`Sub Account created for chain ${chainId}!`);

      addLog({
        type: 'message',
        data: `New Sub Account created: ${newSubAccount.address} on chain ${chainId}`,
      });
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';
      setStatus(`Sub Account creation failed: ${errorMessage}`);
    } finally {
      setLoadingSubAccount(false);
    }
  };

  const createSubAccountWithSpendPermission = async () => {
    if (!provider) {
      setStatus('Provider not initialized');
      return;
    }

    setLoadingSubAccount(true);
    setLoadingSpendPermission(true);
    setStatus('Creating Sub Account with Spend Permission...');

    try {
      // First, ensure we're connected by requesting accounts
      await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });

      // Step 1: Create sub account
      const newSubAccount = (await provider.request({
        method: 'wallet_addSubAccount',
        params: [
          {
            account: {
              type: 'create',
            },
          },
        ],
      })) as WalletAddSubAccountResponse;

      setSubAccount(newSubAccount);
      setStatus('Sub Account created! Now requesting spend permission...');

      // Step 2: Request spend permission following the docs
      const permission = await requestSpendPermission({
        account: universalAddress as `0x${string}`,
        spender: newSubAccount.address, // Sub account as spender
        token: ETH_TOKEN_ADDRESS,
        chainId: chainId,
        allowance: SPEND_ALLOWANCE,
        periodInDays: SPEND_PERIOD_DAYS,
        provider: provider,
      });

      setSpendPermission(permission);
      setStatus('Sub Account created with Spend Permission! Ready to transact.');

      addLog({
        type: 'message',
        data: `Sub Account with Spend Permission created: ${newSubAccount.address} (${formatEther(SPEND_ALLOWANCE)} ETH allowance)`,
      });
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';
      setStatus(`Creation failed: ${errorMessage}`);
      setSubAccount(null);
      setSpendPermission(null);
    } finally {
      setLoadingSubAccount(false);
      setLoadingSpendPermission(false);
    }
  };

  const transactWithSpendPermission = useCallback(async () => {
    if (!spendPermission || !subAccount) {
      setStatus('No spend permission or sub account available');
      return;
    }

    setLoadingSpendPermission(true);
    setStatus('Transacting using Spend Permission...');

    try {
      // Prepare the spend calls following the docs
      const spendCalls = await prepareSpendCallData(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spendPermission as any,
        TRANSACTION_AMOUNT,
      );

      // Execute the calls using the sub account (spender)
      const callsId = (await provider!.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '2.0',
            atomicRequired: true,
            chainId: numberToHex(chainId),
            from: subAccount.address, // Sub account is the spender
            calls: spendCalls,
            capabilities: {},
          },
        ],
      })) as string;

      setStatus(`Spend Permission transaction sent! Calls ID: ${callsId}`);

      addLog({
        type: 'message',
        data: `Spend Permission transaction sent: ${callsId} (${formatEther(TRANSACTION_AMOUNT)} ETH)`,
      });
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';
      setStatus(`Spend transaction failed: ${errorMessage}`);
    } finally {
      setLoadingSpendPermission(false);
    }
  }, [spendPermission, subAccount, provider, chainId, addLog]);

  const sendCalls = useCallback(
    async (calls: Array<{ to: string; data: string; value: string }>, from: string) => {
      if (!provider) {
        setStatus('Provider not available');
        return;
      }

      setLoadingSubAccount(true);
      setStatus('Sending calls...');

      try {
        const requestParams = {
          version: '2.0',
          atomicRequired: true,
          chainId: numberToHex(chainId),
          from,
          calls,
          capabilities: {},
        };

        const callsId = (await provider.request({
          method: 'wallet_sendCalls',
          params: [requestParams],
        })) as string;

        setStatus(`Calls sent! Calls ID: ${callsId}`);

        addLog({
          type: 'message',
          data: `Sub Account transaction sent: ${callsId} from ${from}`,
        });
      } catch (error) {
        const errorMessage = (error as Error)?.message || 'Unknown error';

        if (errorMessage.includes('passkey_public_key') || errorMessage.includes('mismatched')) {
          setStatus(
            `❌ Chain Mismatch: This sub-account was created on a different chain. Click "Create New Sub Account" to fix this.`,
          );
        } else {
          setStatus(`Send calls failed: ${errorMessage}`);
        }
      } finally {
        setLoadingSubAccount(false);
      }
    },
    [provider, chainId, addLog],
  );

  const sendCallsFromSubAccount = useCallback(async () => {
    if (!subAccount) {
      setStatus('Sub account not available');
      return;
    }

    const calls = [
      {
        to: '0x4bbfd120d9f352a0bed7a014bd67913a2007a878',
        data: '0x9846cd9e', // yoink
        value: '0x0',
      },
    ];

    await sendCalls(calls, subAccount.address);
  }, [sendCalls, subAccount]);

  return (
    <FeatureLayout showCard={false}>
      {!displayIsConnected ? (
        <ConnectWalletPrompt />
      ) : (
        <div className="max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sub Account Demo</h1>
            <p className="text-gray-400">Create and manage sub accounts using Base Account SDK</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6 overflow-hidden">
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-gray-300 font-medium block">Status:</span>
                <div className="text-white text-sm break-words overflow-wrap-anywhere whitespace-pre-wrap">
                  {status}
                </div>
              </div>
              {universalAddress && (
                <div className="space-y-1">
                  <span className="text-gray-300 font-medium block">Universal Account:</span>
                  <div className="text-white font-mono text-sm break-all overflow-wrap-anywhere word-break-all">
                    {universalAddress}
                  </div>
                </div>
              )}
              {subAccount && (
                <div className="space-y-1">
                  <span className="text-gray-300 font-medium block">Sub Account:</span>
                  <div className="text-white font-mono text-sm break-all overflow-wrap-anywhere word-break-all">
                    {subAccount.address}
                  </div>
                </div>
              )}
              {!!spendPermission && (
                <div className="space-y-1">
                  <span className="text-gray-300 font-medium block">Spend Permission:</span>
                  <div className="text-green-400 text-sm">
                    ✅ Active ({formatEther(SPEND_ALLOWANCE)} ETH allowance for {SPEND_PERIOD_DAYS} days)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {!connected ? (
              <div className="space-y-4">
                <p className="text-white text-center">
                  Please connect your wallet using the global header to continue.
                </p>
              </div>
            ) : !subAccount ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Button
                      onClick={createSubAccountWithSpendPermission}
                      isLoading={loadingSubAccount || loadingSpendPermission}
                      fullWidth
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loadingSubAccount || loadingSpendPermission
                        ? 'Creating...'
                        : 'Create Sub Account with Spend Permission'}
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <Button onClick={createSubAccount} isLoading={loadingSubAccount} fullWidth>
                      {loadingSubAccount ? 'Creating...' : `Create Sub Account (No Spend Limit)`}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {!!spendPermission ? (
                    <div className="flex justify-center">
                      <Button
                        onClick={transactWithSpendPermission}
                        isLoading={loadingSpendPermission}
                        fullWidth
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loadingSpendPermission
                          ? 'Transacting...'
                          : `💰 Transact with Spend Permission (${formatEther(TRANSACTION_AMOUNT)} ETH)`}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Button onClick={sendCallsFromSubAccount} isLoading={loadingSubAccount} fullWidth>
                        {loadingSubAccount ? 'Sending...' : '📤 Send Transaction (yoink)'}
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      onClick={createNewSubAccountForCurrentChain}
                      isLoading={loadingSubAccount}
                      fullWidth
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {loadingSubAccount ? 'Creating...' : `🔄 Create Another Sub Account`}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      setProvider(null);
                      setSubAccount(null);
                      setSpendPermission(null);
                      setStatus('');
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    className="bg-red-600 hover:bg-red-700"
                    fullWidth
                  >
                    🧹 Complete Reset (Clear All State)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </FeatureLayout>
  );
}
