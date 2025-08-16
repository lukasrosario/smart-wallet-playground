import { createBaseAccountSDK } from '@base-org/account';
import { useCallback, useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { numberToHex } from 'viem';
import { FeatureLayout } from './ui/FeatureLayout';
import { ConnectWalletPrompt } from './ui/ConnectWalletPrompt';
import { Button } from './ui/Button';
import { useAccount } from 'wagmi';
import { useHydration } from '../hooks/useHydration';

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
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isHydrated = useHydration();

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;

  const [provider, setProvider] = useState<ReturnType<ReturnType<typeof createBaseAccountSDK>['getProvider']> | null>(
    null,
  );
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null);
  const [loadingSubAccount, setLoadingSubAccount] = useState(false);
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
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';
      setStatus(`Sub Account creation failed: ${errorMessage}`);
    } finally {
      setLoadingSubAccount(false);
    }
  };

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
    [provider, chainId],
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
                <div className="flex justify-center">
                  <Button onClick={createSubAccount} isLoading={loadingSubAccount} fullWidth>
                    {loadingSubAccount ? 'Creating...' : `Create Sub Account for Chain ${chainId}`}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Button onClick={sendCallsFromSubAccount} isLoading={loadingSubAccount} fullWidth>
                      {loadingSubAccount ? 'Sending...' : '📤 Send Transaction (yoink)'}
                    </Button>
                  </div>
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
