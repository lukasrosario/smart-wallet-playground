import { useCallback, useState } from 'react';
import { useWallet } from '../context/WalletContext';

const CHAIN_SHORTCUTS = {
  Optimism: '0xa',
  Base: '0x2105',
  Sepolia: '0xaa36a7',
  'Base Sepolia': '0x14a34',
} as const;

export function ChainConfig() {
  const { provider, addLog } = useWallet();
  const [chainId, setChainId] = useState<string>('');

  const switchChain = useCallback(
    async (targetChainId: string) => {
      if (!targetChainId) return;

      try {
        await provider?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
      } catch (error) {
        addLog({
          type: 'error',
          data: error,
        });
      }
    },
    [provider, addLog],
  );

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <h2 className="text-white mb-2 self-center">Chain Config</h2>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(CHAIN_SHORTCUTS).map(([name, chainId]) => (
          <button
            key={chainId}
            onClick={() => switchChain(chainId)}
            className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {name}
          </button>
        ))}
      </div>

      <label className="flex flex-col text-white text-sm">
        Custom Chain ID
        <div className="flex space-x-2 mt-1">
          <input
            type="text"
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
          />
          <button
            onClick={() => chainId && switchChain(chainId)}
            className="px-4 py-1 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Switch
          </button>
        </div>
      </label>
    </div>
  );
}
