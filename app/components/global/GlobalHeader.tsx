'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '../../context/WagmiContextProvider';
import { useConnect, useDisconnect, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useHydration } from '../../hooks/useHydration';

const CHAIN_SHORTCUTS = {
  Base: 8453,
  'Base Sepolia': 84532,
} as const;

export function GlobalHeader() {
  const { addLog } = useWallet();
  const { connectors, connect: wagmiConnect, isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const isHydrated = useHydration();
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [customChainId, setCustomChainId] = useState('');

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;
  const displayIsConnecting = isHydrated && isConnecting;
  const displayConnectedAddress = isHydrated ? connectedAddress : undefined;
  const currentChain = chainId ? `0x${chainId.toString(16)}` : undefined;
  const currentChainName = chainId ? Object.entries(CHAIN_SHORTCUTS).find(([, id]) => id === chainId)?.[0] : undefined;

  const handleSwitchChain = useCallback(
    async (targetChainId: number) => {
      if (!displayIsConnected) return;

      try {
        switchChain({ chainId: targetChainId });
        addLog({
          type: 'message',
          data: `Switching to chain ${targetChainId}`,
        });
        setShowChainDropdown(false);
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

    const targetChainId = customChainId.startsWith('0x') ? parseInt(customChainId, 16) : parseInt(customChainId, 10);

    if (isNaN(targetChainId)) {
      addLog({
        type: 'error',
        data: 'Invalid chain ID format',
      });
      return;
    }

    handleSwitchChain(targetChainId);
    setCustomChainId('');
  }, [customChainId, handleSwitchChain, addLog]);

  const connect = useCallback(async () => {
    try {
      if (connectors.length > 0) {
        const connector = connectors[0];
        wagmiConnect({ connector });
        addLog({
          type: 'message',
          data: `Connecting with ${connector.name}...`,
        });
      }
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [connectors, wagmiConnect, addLog]);

  const disconnect = useCallback(async () => {
    try {
      wagmiDisconnect();
      addLog({
        type: 'message',
        data: 'Disconnecting wallet...',
      });
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [wagmiDisconnect, addLog]);

  return (
    <header className="absolute top-0 right-0 z-50 p-6">
      <div className="flex items-center space-x-3">
        {/* Connected Address */}
        {displayIsConnected && displayConnectedAddress && (
          <div
            className="px-4 py-3 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl cursor-pointer hover:from-gray-800 hover:to-gray-900 transition-all group relative shadow-lg backdrop-blur-sm"
            onClick={() => {
              navigator.clipboard.writeText(displayConnectedAddress);
              setShowCopiedToast(true);
              setTimeout(() => setShowCopiedToast(false), 2000);
            }}
            title={`Click to copy: ${displayConnectedAddress}`}
          >
            <span className="text-sm font-mono text-white group-hover:text-blue-300 transition-colors">
              {displayConnectedAddress.slice(0, 6)}...{displayConnectedAddress.slice(-4)}
            </span>

            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs">📋</span>
          </div>
        )}

        {/* Chain Selector */}
        {displayIsConnected && (
          <div className="relative">
            <button
              onClick={() => setShowChainDropdown(!showChainDropdown)}
              disabled={isSwitchingChain}
              className={`flex items-center space-x-2 px-4 py-3 bg-gradient-to-br from-blue-950/80 to-gray-900 border-2 border-blue-800/60 rounded-2xl transition-all shadow-lg backdrop-blur-sm ${
                isSwitchingChain
                  ? 'cursor-not-allowed opacity-75'
                  : 'cursor-pointer hover:from-blue-900/80 hover:to-gray-800 hover:border-blue-700/80 hover:scale-[1.02] hover:shadow-blue-500/20'
              }`}
            >
              <span className="text-sm text-blue-300 font-medium">Chain:</span>
              <span className="text-sm font-mono text-white">
                {isSwitchingChain ? 'Switching...' : currentChainName || currentChain}
              </span>
              <span className="text-blue-400 text-xs">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showChainDropdown && (
              <div className="absolute top-full right-0 mt-3 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl shadow-2xl z-50 min-w-48 backdrop-blur-sm">
                <div className="p-4">
                  {/* Preset Chains */}
                  <div className="space-y-2 mb-4">
                    {Object.entries(CHAIN_SHORTCUTS).map(([name, id]) => (
                      <button
                        key={id}
                        onClick={() => handleSwitchChain(id)}
                        disabled={isSwitchingChain}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all ${
                          chainId === id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-200 hover:bg-gray-800/50 border border-gray-700/50'
                        } ${isSwitchingChain ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:scale-[1.02]'}`}
                      >
                        {name} ({id})
                      </button>
                    ))}
                  </div>

                  {/* Custom Chain Input */}
                  <div className="border-t border-gray-800 pt-4">
                    <div className="text-xs text-gray-400 mb-3 font-medium">Custom Chain ID:</div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customChainId}
                        onChange={(e) => setCustomChainId(e.target.value)}
                        placeholder="0x... or decimal"
                        className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-2xl text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCustomChainSwitch();
                          }
                        }}
                      />
                      <button
                        onClick={handleCustomChainSwitch}
                        disabled={!customChainId || isSwitchingChain}
                        className={`px-3 py-2 rounded-2xl text-xs font-medium transition-all duration-200 ${
                          !customChainId || isSwitchingChain
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white cursor-pointer hover:scale-[1.02] shadow-lg shadow-blue-500/25'
                        }`}
                      >
                        Go
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connect/Disconnect Buttons */}
        {!displayIsConnected ? (
          <button
            onClick={connect}
            disabled={displayIsConnecting}
            className={`px-6 py-3 rounded-2xl border text-white transition-all duration-200 font-semibold shadow-lg ${
              displayIsConnecting
                ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-75'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border-blue-500 cursor-pointer hover:scale-[1.02] shadow-blue-500/25'
            }`}
          >
            {!isHydrated ? 'Loading...' : displayIsConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-6 py-3 rounded-2xl border bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-red-500 text-white transition-all duration-200 cursor-pointer font-semibold hover:scale-[1.02] shadow-lg shadow-red-500/25"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Toast notification for copied address */}
      {showCopiedToast && (
        <div className="fixed top-20 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 transition-all font-semibold border border-green-400">
          Address copied to clipboard!
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showChainDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowChainDropdown(false)} />}
    </header>
  );
}
