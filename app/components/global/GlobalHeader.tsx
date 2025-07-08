'use client';

import { useCallback, useState, useMemo } from 'react';
import { useWallet } from '../../context/WagmiContextProvider';
import { useConnect, useDisconnect, useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useHydration } from '../../hooks/useHydration';
import { usePathname } from 'next/navigation';
import { getFeatureByRoute } from '../../../lib/features/registry';

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
  const pathname = usePathname();

  // Get current feature info for header title
  const currentFeature = useMemo(() => getFeatureByRoute(pathname), [pathname]);
  const headerTitle = currentFeature ? `${currentFeature.icon} ${currentFeature.title}` : '🏠 Dashboard';

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
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">{headerTitle}</h1>
        </div>

        {/* Global Actions */}
        <div className="flex items-center space-x-4">
          {/* Connected Address */}
          {displayIsConnected && displayConnectedAddress && (
            <div
              className="px-3 py-1 bg-slate-700 rounded-md cursor-pointer hover:bg-slate-600 transition-colors group relative"
              onClick={() => {
                navigator.clipboard.writeText(displayConnectedAddress);
                setShowCopiedToast(true);
                setTimeout(() => setShowCopiedToast(false), 2000);
              }}
              title={`Click to copy: ${displayConnectedAddress}`}
            >
              <span className="text-sm font-mono text-white group-hover:text-blue-300 transition-colors">
                {displayConnectedAddress}
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
                className={`flex items-center space-x-2 px-3 py-1 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors ${
                  isSwitchingChain ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                }`}
              >
                <span className="text-sm text-slate-300">Chain:</span>
                <span className="text-sm font-mono text-white">
                  {isSwitchingChain ? 'Switching...' : currentChainName || currentChain}
                </span>
                <span className="text-slate-400 text-xs">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showChainDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 min-w-48">
                  <div className="p-2">
                    {/* Preset Chains */}
                    <div className="space-y-1 mb-3">
                      {Object.entries(CHAIN_SHORTCUTS).map(([name, id]) => (
                        <button
                          key={id}
                          onClick={() => handleSwitchChain(id)}
                          disabled={isSwitchingChain}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            chainId === id ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-600'
                          } ${isSwitchingChain ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                        >
                          {name} ({id})
                        </button>
                      ))}
                    </div>

                    {/* Custom Chain Input */}
                    <div className="border-t border-slate-600 pt-3">
                      <div className="text-xs text-slate-400 mb-2">Custom Chain ID:</div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={customChainId}
                          onChange={(e) => setCustomChainId(e.target.value)}
                          placeholder="0x... or decimal"
                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCustomChainSwitch();
                            }
                          }}
                        />
                        <button
                          onClick={handleCustomChainSwitch}
                          disabled={!customChainId || isSwitchingChain}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            !customChainId || isSwitchingChain
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
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
          <div className="flex space-x-2">
            {!displayIsConnected ? (
              <button
                onClick={connect}
                disabled={displayIsConnecting}
                className={`px-4 py-2 rounded-md border text-white transition-colors ${
                  displayIsConnecting
                    ? 'bg-slate-600 border-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 border-blue-500 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {!isHydrated ? 'Loading...' : displayIsConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="px-4 py-2 rounded-md border bg-red-600 border-red-500 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification for copied address */}
      {showCopiedToast && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all">
          Address copied to clipboard!
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showChainDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowChainDropdown(false)} />}
    </header>
  );
}
