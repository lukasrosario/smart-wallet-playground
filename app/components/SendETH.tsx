import { useCallback, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { isAddress, parseEther, toHex } from 'viem';

const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const;

const AMOUNT_SHORTCUTS = {
  '0.00001Ξ': '0.00001',
  '0.0001Ξ': '0.0001',
  '0.001Ξ': '0.001',
} as const;

export function SendETH() {
  const { provider, addLog, currentChain } = useWallet();
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  const sendETH = useCallback(async () => {
    if (!amount) return;
    if (!toAddress || !isAddress(toAddress)) return;
    if (!currentChain) return;

    try {
      await provider?.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '1.0',
            chainId: currentChain,
            calls: [
              {
                to: toAddress,
                data: '0x',
                value: toHex(parseEther(amount)),
              },
            ],
          },
        ],
      });
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [amount, provider, toAddress, currentChain, addLog]);

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <h2 className="text-white mb-2 self-center">ETH Send</h2>

      <div className="flex flex-col space-y-4">
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
            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
          />
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
          onClick={sendETH}
          disabled={!amount || !currentChain}
          className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Send ETH
        </button>
      </div>
    </div>
  );
}
