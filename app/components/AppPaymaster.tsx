import { useCallback, useState, useEffect, useMemo } from 'react';
import { useChainId, useSendCalls, useAccount } from 'wagmi';
import { useWallet } from '../context/WagmiContextProvider';
import { useHydration } from '../hooks/useHydration';

const PAYMASTER_SUPPORTED_CHAINS = {
  // 10: 'Optimism',
  8453: 'Base',
  // 11155111: 'Sepolia',
  84532: 'Base Sepolia',
} as const;

export function AppPaymaster() {
  const { addLog } = useWallet();
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const isHydrated = useHydration();

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;
  const displayCurrentChainId = isHydrated ? currentChainId : undefined;

  // WAGMI hook for sponsored transactions
  const { sendCalls, data: callsResult, isPending: isSendingCalls, error: sendCallsError } = useSendCalls();

  const [sponsor, setSponsor] = useState<string>('');
  const callsId = callsResult?.id || '';

  const currentChainSupported = displayCurrentChainId ? displayCurrentChainId in PAYMASTER_SUPPORTED_CHAINS : false;

  // Log when sendCalls result is received
  useEffect(() => {
    if (callsResult) {
      addLog({
        type: 'message',
        data: `Sponsored transaction initiated with ID: ${callsResult.id}`,
      });
    }
  }, [callsResult, addLog]);

  // Log sendCalls errors
  useEffect(() => {
    if (sendCallsError) {
      addLog({
        type: 'error',
        data: `Sponsored transaction failed: ${sendCallsError.message}`,
      });
    }
  }, [sendCallsError, addLog]);

  const sendSponsoredTransaction = useCallback(async () => {
    if (!displayIsConnected || !currentChainSupported) return;

    try {
      addLog({
        type: 'message',
        data: `Sending sponsored empty transaction via WAGMI useSendCalls`,
      });

      sendCalls({
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
            data: '0x',
            // Empty transaction - no value
          },
        ],
        capabilities: {
          paymasterService: {
            url: `${document.location.origin}/api/paymaster/${encodeURIComponent(sponsor === '' ? 'Smart Wallet Playground' : sponsor)}`,
          },
        },
      });

      addLog({
        type: 'message',
        data: `WAGMI useSendCalls initiated for sponsored transaction`,
      });
    } catch (error) {
      addLog({
        type: 'error',
        data: `Sponsored transaction failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }, [displayIsConnected, sponsor, addLog, currentChainSupported, sendCalls]);

  const getButtonText = useMemo(() => {
    if (!isHydrated) return 'Loading...';
    if (!displayIsConnected) return 'Connect Wallet';
    if (!currentChainSupported) return 'Unsupported Chain';
    if (isSendingCalls) return 'Sending...';
    if (callsId) return 'Transaction Submitted';
    return 'Send Transaction';
  }, [isHydrated, displayIsConnected, currentChainSupported, isSendingCalls, callsId]);

  const isButtonDisabled = !displayIsConnected || !currentChainSupported || isSendingCalls || !!callsId;

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4">
      <h2 className="text-white mb-2 self-center">App Paymaster</h2>

      <div className="flex flex-col space-y-4">
        {/* Chain Status */}
        {displayIsConnected && (
          <div className={`text-sm text-center ${currentChainSupported ? 'text-green-400' : 'text-red-400'}`}>
            {isHydrated
              ? `Current Chain: ${PAYMASTER_SUPPORTED_CHAINS[displayCurrentChainId as keyof typeof PAYMASTER_SUPPORTED_CHAINS] || `Chain ${displayCurrentChainId}`}${!currentChainSupported ? ' (Not Supported)' : ''}`
              : 'Loading...'}
          </div>
        )}

        {/* Description */}
        <p className="text-slate-400 text-sm text-center">
          Send empty transaction (0 ETH to null address) sponsored by paymaster
        </p>

        {/* Sponsor Input */}
        <div className="flex flex-col space-y-2">
          <label className="text-white text-sm">Sponsor</label>
          <input
            type="text"
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            placeholder="Smart Wallet Playground"
            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
          />
          <p className="text-slate-400 text-xs">Used for paymaster service identification</p>
        </div>

        <button
          onClick={sendSponsoredTransaction}
          disabled={isButtonDisabled}
          className={`py-2 px-4 rounded-md border transition-colors ${
            isButtonDisabled
              ? 'bg-slate-600 text-slate-400 border-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 cursor-pointer'
          }`}
        >
          {getButtonText}
        </button>

        {/* Transaction Status */}
        {callsId && (
          <div className="text-center space-y-1">
            <div className="text-xs font-mono text-slate-300">Calls ID: {callsId}</div>
            <div className="text-xs text-green-400">Status: Submitted</div>
          </div>
        )}

        {/* Error Display */}
        {sendCallsError && <div className="text-red-400 text-xs">Error: {sendCallsError.message}</div>}

        {!displayIsConnected && (
          <div className="text-slate-400 text-sm text-center">Connect wallet to test paymaster functionality</div>
        )}

        {displayIsConnected && !currentChainSupported && (
          <div className="text-yellow-400 text-sm text-center">
            Switch to a supported chain: {Object.values(PAYMASTER_SUPPORTED_CHAINS).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
