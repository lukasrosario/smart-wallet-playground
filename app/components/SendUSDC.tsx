import { useCallback, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { encodeFunctionData, erc20Abi, isAddress, numberToHex, parseUnits } from 'viem';
import { base } from 'viem/chains';

const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const;

const AMOUNT_SHORTCUTS = {
  '1¢': '0.01',
  '10¢': '0.10',
  $1: '1.00',
} as const;

const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

export function SendUSDC() {
  const { provider, addLog } = useWallet();
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  const sendUSDC = useCallback(async () => {
    if (!amount) return;
    if (!toAddress || !isAddress(toAddress)) return;

    try {
      await provider?.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '1.0',
            chainId: numberToHex(base.id),
            calls: [
              {
                to: BASE_USDC_ADDRESS,
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [toAddress, parseUnits(amount, 6)],
                }),
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
  }, [provider, toAddress, amount, addLog]);

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4">
      <h2 className="text-white mb-2 self-center">Simple USDC Send</h2>

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-white text-sm">To Address</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => setToAddress(VITALIK_ADDRESS)}
              className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm"
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
          <label className="text-white text-sm">Amount (USDC)</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {Object.entries(AMOUNT_SHORTCUTS).map(([label, value]) => (
              <button
                key={value}
                onClick={() => setAmount(value)}
                className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm"
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
          onClick={sendUSDC}
          disabled={!amount || !toAddress || !isAddress(toAddress)}
          className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send USDC
        </button>
      </div>
    </div>
  );
}
