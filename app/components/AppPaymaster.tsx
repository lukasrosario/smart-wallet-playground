import { useCallback, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { toHex } from 'viem';

export function AppPaymaster() {
  const { provider, addLog, currentChain } = useWallet();
  const [sponsor, setSponsor] = useState<string>('');

  const sendEmptyTx = useCallback(async () => {
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
                to: '0x0000000000000000000000000000000000000000',
                data: '0x',
                value: toHex(0),
              },
            ],
            capabilities: {
              paymasterService: {
                url: `${document.location.origin}/api/paymaster`,
                context: {
                  sponsor: sponsor === '' ? 'Smart Wallet Playground' : sponsor,
                },
              },
            },
          },
        ],
      });
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [provider, currentChain, sponsor, addLog]);

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4">
      <h2 className="text-white mb-2 self-center">App Paymaster</h2>

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-white text-sm">Sponsor</label>
          <input
            type="text"
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            placeholder="Smart Wallet Playground"
            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
          />
        </div>

        <button
          onClick={sendEmptyTx}
          disabled={!currentChain}
          className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Send Empty Transaction
        </button>
      </div>
    </div>
  );
}
