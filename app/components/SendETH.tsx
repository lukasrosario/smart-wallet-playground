import { useCallback, useState, useEffect } from 'react';
import { useWagmiTransactions } from '../hooks/useWagmiTransactions';
import { isAddress } from 'viem';
import { useHydration } from '../hooks/useHydration';

const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const;

const AMOUNT_SHORTCUTS = {
  '0.00001Ξ': '0.00001',
  '0.0001Ξ': '0.0001',
  '0.001Ξ': '0.001',
} as const;

export function SendETH() {
  const {
    sendETH,
    isSendingETH,
    ethTxHash,
    ethTxReceipt,
    isWaitingForETH,
    ethTxError,
    ethBalance,
    currentChain,
    isConnected,
  } = useWagmiTransactions();

  const isHydrated = useHydration();

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;

  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // Log transaction status changes
  useEffect(() => {
    if (ethTxHash) {
      console.log('ETH transaction hash:', ethTxHash);
    }
  }, [ethTxHash]);

  useEffect(() => {
    if (ethTxReceipt) {
      console.log('ETH transaction confirmed:', ethTxReceipt);
    }
  }, [ethTxReceipt]);

  useEffect(() => {
    if (ethTxError) {
      console.error('ETH transaction error:', ethTxError);
    }
  }, [ethTxError]);

  const handleSendETH = useCallback(async () => {
    if (!amount) return;
    if (!toAddress || !isAddress(toAddress)) return;
    if (!currentChain || !displayIsConnected) return;

    try {
      await sendETH(toAddress, amount);
    } catch (error) {
      console.error('Failed to send ETH:', error);
    }
  }, [amount, toAddress, currentChain, displayIsConnected, sendETH]);

  const getButtonText = () => {
    if (isSendingETH) return 'Sending...';
    if (isWaitingForETH) return 'Confirming...';
    return 'Send ETH';
  };

  const isButtonDisabled = () => {
    return !amount || !currentChain || !displayIsConnected || isSendingETH || isWaitingForETH || !isAddress(toAddress);
  };

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <h2 className="text-white mb-2 self-center">ETH Send</h2>

      <div className="flex flex-col space-y-4">
        {/* Balance Display */}
        {displayIsConnected && (
          <div className="text-white text-sm">
            {isHydrated ? `Balance: ${parseFloat(ethBalance).toFixed(6)} ETH` : 'Loading...'}
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <label className="text-white text-sm">To Address</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => setToAddress(VITALIK_ADDRESS)}
              className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm cursor-pointer"
            >
              vitalik.eth
            </button>
          </div>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            className={`px-2 py-1 bg-slate-700 border rounded text-white font-mono ${
              toAddress && !isAddress(toAddress) ? 'border-red-500' : 'border-slate-600'
            }`}
          />
          {toAddress && !isAddress(toAddress) && <span className="text-red-400 text-xs">Invalid address</span>}
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-white text-sm">Amount (ETH)</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {Object.entries(AMOUNT_SHORTCUTS).map(([label, value]) => (
              <button
                key={value}
                onClick={() => setAmount(value)}
                className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
          />
        </div>

        <button
          onClick={handleSendETH}
          disabled={isButtonDisabled()}
          className={`py-2 px-4 rounded-md border transition-colors ${
            isButtonDisabled()
              ? 'bg-slate-600 text-slate-400 border-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 cursor-pointer'
          }`}
        >
          {getButtonText()}
        </button>

        {/* Transaction Status */}
        {ethTxHash && (
          <div className="text-white text-xs">
            <div>
              Hash: {ethTxHash.slice(0, 10)}...{ethTxHash.slice(-8)}
            </div>
            {ethTxReceipt && <div className="text-green-400">✓ Confirmed</div>}
          </div>
        )}

        {ethTxError && <div className="text-red-400 text-xs">Error: {ethTxError.message || 'Transaction failed'}</div>}

        {!displayIsConnected && <div className="text-slate-400 text-sm text-center">Connect wallet to send ETH</div>}
      </div>
    </div>
  );
}
