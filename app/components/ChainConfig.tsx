import { useCallback, useState } from 'react';
import { useSwitchChain, useChainId } from 'wagmi';
import { useWallet } from '../context/WAGMIContext';
import { useHydration } from '../hooks/useHydration';

const CHAIN_SHORTCUTS = {
  // Optimism: 10,
  Base: 8453,
  // Sepolia: 11155111,
  'Base Sepolia': 84532,
} as const;

export function ChainConfig() {
  const { addLog, isConnected } = useWallet();
  const { switchChain, isPending, error } = useSwitchChain();
  const currentChainId = useChainId();
  const [customChainId, setCustomChainId] = useState<string>('');
  const isHydrated = useHydration();

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;
  const displayCurrentChainId = isHydrated ? currentChainId : undefined;

  const handleSwitchChain = useCallback(
    async (targetChainId: number) => {
      if (!displayIsConnected) {
        addLog({
          type: 'error',
          data: 'Wallet not connected',
        });
        return;
      }

      try {
        switchChain({ chainId: targetChainId });
        addLog({
          type: 'message',
          data: `Switching to chain ${targetChainId}`,
        });
      } catch (error) {
        addLog({
          type: 'error',
          data: `Failed to switch chain: ${error}`,
        });
      }
    },
    [switchChain, addLog, displayIsConnected],
  );

  const handleCustomChainSwitch = useCallback(() => {
    if (!customChainId) return;

    const chainId = customChainId.startsWith('0x') ? parseInt(customChainId, 16) : parseInt(customChainId, 10);

    if (isNaN(chainId)) {
      addLog({
        type: 'error',
        data: 'Invalid chain ID format',
      });
      return;
    }

    handleSwitchChain(chainId);
  }, [customChainId, handleSwitchChain, addLog]);

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <h2 className="text-white mb-2 self-center">Chain Config</h2>

      {/* Current Chain Display */}
      {displayIsConnected && displayCurrentChainId && (
        <div className="text-white text-sm mb-4 text-center">
          {isHydrated ? `Current: ${displayCurrentChainId} (0x${displayCurrentChainId.toString(16)})` : 'Loading...'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(CHAIN_SHORTCUTS).map(([name, chainId]) => (
          <button
            key={chainId}
            onClick={() => handleSwitchChain(chainId)}
            disabled={!displayIsConnected || isPending}
            className={`py-2 px-4 rounded-md border transition-colors text-sm ${
              !displayIsConnected || isPending
                ? 'bg-slate-600 text-slate-400 border-slate-500 cursor-not-allowed'
                : displayCurrentChainId === chainId
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 cursor-pointer'
            }`}
          >
            {isPending ? 'Switching...' : name}
          </button>
        ))}
      </div>

      <label className="flex flex-col text-white text-sm">
        Custom Chain ID
        <div className="flex space-x-2 mt-1">
          <input
            type="text"
            value={customChainId}
            onChange={(e) => setCustomChainId(e.target.value)}
            placeholder="0x... or decimal"
            className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
          />
          <button
            onClick={handleCustomChainSwitch}
            disabled={!customChainId || !displayIsConnected || isPending}
            className={`px-4 py-1 rounded-md border transition-colors ${
              !customChainId || !displayIsConnected || isPending
                ? 'bg-slate-600 text-slate-400 border-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600 cursor-pointer'
            }`}
          >
            {isPending ? 'Switching...' : 'Switch'}
          </button>
        </div>
      </label>

      {/* Error Display */}
      {error && <div className="text-red-400 text-xs mt-2">Error: {error.message}</div>}

      {!displayIsConnected && (
        <div className="text-slate-400 text-sm text-center mt-2">Connect wallet to switch chains</div>
      )}
    </div>
  );
}
