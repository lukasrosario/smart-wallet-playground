'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '../../context/WagmiContextProvider';
import { useConnect, useDisconnect, useAccount, useChainId } from 'wagmi';
import { useHydration } from '../../hooks/useHydration';
import { usePathname } from 'next/navigation';
import { getFeatureByRoute } from '../../../lib/features/registry';

export function GlobalHeader() {
  const { addLog } = useWallet();
  const { connectors, connect: wagmiConnect, isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const isHydrated = useHydration();
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const pathname = usePathname();

  // Get current feature info for header title
  const currentFeature = getFeatureByRoute(pathname);
  const headerTitle = currentFeature ? `${currentFeature.icon} ${currentFeature.title}` : '🏠 Dashboard';

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;
  const displayIsConnecting = isHydrated && isConnecting;
  const displayConnectedAddress = isHydrated ? connectedAddress : undefined;
  const currentChain = chainId ? `0x${chainId.toString(16)}` : undefined;

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
          {/* Chain Info */}
          {currentChain && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-700 rounded-md">
              <span className="text-sm text-slate-300">Chain:</span>
              <span className="text-sm font-mono text-white">{currentChain}</span>
            </div>
          )}

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
                {displayConnectedAddress.slice(0, 6)}...{displayConnectedAddress.slice(-4)}
              </span>

              {/* Copy icon that appears on hover */}
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs">📋</span>
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
    </header>
  );
}
