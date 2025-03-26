import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';

export function ConnectWallet() {
  const { provider, addLog, connectedAddress, setConnectedAddress } = useWallet();
  const [currentChain, setCurrentChain] = useState<string | undefined>(undefined);

  const updateChainId = useCallback(async () => {
    try {
      const chainId = (await provider?.request({ method: 'eth_chainId' })) as string;
      setCurrentChain(chainId);
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [provider, addLog]);

  useEffect(() => {
    if (provider && connectedAddress) {
      updateChainId();
    } else {
      setCurrentChain(undefined);
    }
  }, [provider, connectedAddress, updateChainId]);

  useEffect(() => {
    if (provider) {
      provider.on('chainChanged', (chainId: string) => {
        setCurrentChain(chainId);
      });
    }
  }, [provider]);

  const connect = useCallback(async () => {
    try {
      const accounts = (await provider?.request({ method: 'eth_requestAccounts' })) as `0x${string}`[];
      setConnectedAddress(accounts[0]);
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [provider, addLog]);

  const disconnect = useCallback(async () => {
    try {
      await provider?.disconnect();
      setConnectedAddress(undefined);
    } catch (error) {
      addLog({
        type: 'error',
        data: error,
      });
    }
  }, [provider, setConnectedAddress, addLog]);

  return (
    <>
      <div className="flex flex-row space-x-4 self-center">
        <button
          onClick={connect}
          className="w-36 py-2 bg-slate-800 text-white rounded-md border border-slate-600 hover:bg-slate-700 cursor-pointer"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          className="w-36 py-2 bg-slate-800 text-white rounded-md border border-slate-600 hover:bg-slate-700 cursor-pointer"
        >
          Disconnect
        </button>
      </div>

      <div className="flex flex-col justify-center bg-slate-800 rounded-md p-4 w-full max-w-xl mx-auto h-24">
        <div className="flex flex-col items-center space-y-2">
          {connectedAddress && (
            <>
              <h2 className="text-white text-sm font-medium">Connected Address</h2>
              <p id="connected-address" className="text-white text-center font-mono">
                {connectedAddress}
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
          {!connectedAddress && <p className="text-white text-center font-mono">No wallet connected</p>}
        </div>
      </div>
    </>
  );
}
