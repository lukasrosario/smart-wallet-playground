import { useCallback } from 'react';
import { useWallet } from '../context/WAGMIContext';
import { useConnect, useDisconnect, useAccount, useChainId } from 'wagmi';
import { useHydration } from '../hooks/useHydration';

export function ConnectWallet() {
  const { addLog } = useWallet();
  const { connectors, connect: wagmiConnect, isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const isHydrated = useHydration();

  // Safe display states to prevent hydration mismatch
  const displayIsConnected = isHydrated && isConnected;
  const displayIsConnecting = isHydrated && isConnecting;
  const displayConnectedAddress = isHydrated ? connectedAddress : undefined;
  const currentChain = chainId ? `0x${chainId.toString(16)}` : undefined;

  const connect = useCallback(async () => {
    try {
      if (connectors.length > 0) {
        // Use the first connector (Coinbase Wallet by default from our config)
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
    <>
      <div className="flex flex-row space-x-4 self-center">
        <button
          onClick={connect}
          disabled={displayIsConnecting || displayIsConnected}
          className={`w-36 py-2 rounded-md border text-white ${
            displayIsConnecting || displayIsConnected
              ? 'bg-slate-600 border-slate-500 cursor-not-allowed'
              : 'bg-slate-800 border-slate-600 hover:bg-slate-700 cursor-pointer'
          }`}
        >
          {!isHydrated
            ? 'Loading...'
            : displayIsConnecting
              ? 'Connecting...'
              : displayIsConnected
                ? 'Connected'
                : 'Connect'}
        </button>
        <button
          onClick={disconnect}
          disabled={!displayIsConnected}
          className={`w-36 py-2 rounded-md border text-white ${
            !displayIsConnected
              ? 'bg-slate-600 border-slate-500 cursor-not-allowed'
              : 'bg-slate-800 border-slate-600 hover:bg-slate-700 cursor-pointer'
          }`}
        >
          Disconnect
        </button>
      </div>

      <div className="flex flex-col justify-center bg-slate-800 rounded-md p-4 w-full max-w-xl mx-auto h-24">
        <div className="flex flex-col items-center space-y-2">
          {displayConnectedAddress && displayIsConnected && (
            <>
              <h2 className="text-white text-sm font-medium">Connected Address</h2>
              <p data-testid="connected-address" className="text-white text-center font-mono">
                {displayConnectedAddress}
              </p>
              {currentChain && (
                <div className="flex justify-center w-full">
                  <div className="inline-flex space-x-2 text-sm font-mono">
                    <span className="text-white">Chain ID:</span>
                    <span className="text-slate-300 w-20 text-right">{currentChain}</span>
                  </div>
                </div>
              )}
            </>
          )}
          {!displayIsConnected && (
            <p className="text-white text-center font-mono">
              {!isHydrated ? 'Loading...' : displayIsConnecting ? 'Connecting...' : 'No wallet connected'}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
