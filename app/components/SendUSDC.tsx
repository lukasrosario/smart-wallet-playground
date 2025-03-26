import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from 'viem';
import { Switch } from './Switch';
import { usePollCallsStatus } from '../hooks/usePollCallsStatus';

const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const;

const AMOUNT_SHORTCUTS = {
  '1¢': '0.01',
  '10¢': '0.10',
  $1: '1.00',
} as const;

const CHAIN_TO_USDC_ADDRESS = {
  '0xa': '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // Optimism
  '0x2105': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  '0xaa36a7': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
} as const;

const CHAIN_NAMES = {
  '0xa': 'Optimism',
  '0x2105': 'Base',
  '0xaa36a7': 'Sepolia',
  '0x14a34': 'Base Sepolia',
} as const;

const CHAIN_TO_EXPLORER = {
  '0xa': 'https://optimistic.etherscan.io',
  '0x2105': 'https://basescan.org',
  '0xaa36a7': 'https://sepolia.etherscan.io',
  '0x14a34': 'https://sepolia.basescan.org',
} as const;

export function SendUSDC() {
  const { provider, addLog, currentChain, connectedAddress } = useWallet();
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [useSendCalls, setUseSendCalls] = useState(true);
  const [callsId, setCallsId] = useState<string>('');
  const [isSponsored, setIsSponsored] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [txChainId, setTxChainId] = useState<keyof typeof CHAIN_TO_USDC_ADDRESS | null>(null);
  const { data: callsStatus } = usePollCallsStatus({ callsId });

  useEffect(() => {
    if (callsStatus?.status === 'CONFIRMED') {
      setTxHash(callsStatus.receipts[0].transactionHash);
    } else {
      setTxHash('');
    }
  }, [callsStatus]);

  useEffect(() => {
    // USDC sends are always sponsored on Base
    if (currentChain === '0x2105') {
      setIsSponsored(true);
    } else {
      setIsSponsored(false);
    }
  }, [currentChain]);

  const isDisabled = !amount || !toAddress || !isAddress(toAddress) || (!connectedAddress && !useSendCalls);

  const sendUSDC = useCallback(
    async (chainId: keyof typeof CHAIN_TO_USDC_ADDRESS) => {
      if (isDisabled) return;

      const usdcAddress = CHAIN_TO_USDC_ADDRESS[chainId];
      setTxChainId(chainId);

      try {
        if (useSendCalls) {
          const id = (await provider?.request({
            method: 'wallet_sendCalls',
            params: [
              {
                version: '1.0',
                chainId,
                sponsored: isSponsored,
                calls: [
                  {
                    to: usdcAddress,
                    data: encodeFunctionData({
                      abi: erc20Abi,
                      functionName: 'transfer',
                      args: [toAddress, parseUnits(amount, 6)],
                    }),
                  },
                ],
              },
            ],
          })) as string;
          setCallsId(id);
        } else {
          const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [toAddress, parseUnits(amount, 6)],
          });

          await provider?.request({
            method: 'eth_sendTransaction',
            params: [
              {
                to: usdcAddress,
                data,
              },
            ],
          });
        }
      } catch (error) {
        addLog({
          type: 'error',
          data: error,
        });
      }
    },
    [isDisabled, useSendCalls, provider, isSponsored, toAddress, amount, addLog],
  );

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <div className="flex flex-col space-y-4">
        <h2 className="text-white self-center">USDC Send</h2>
        <div className="flex flex-col items-center space-y-2">
          <Switch
            checked={useSendCalls}
            onChange={setUseSendCalls}
            leftLabel="eth_sendTransaction"
            rightLabel="wallet_sendCalls"
          />
          <div className="h-1">
            {useSendCalls && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSponsored}
                  onChange={(e) => setIsSponsored(e.target.checked)}
                  disabled={currentChain === '0x2105'}
                  className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-600 focus:ring-offset-0"
                />
                <span className="text-white text-sm">Sponsored</span>
              </label>
            )}
          </div>
        </div>

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
          <label className="text-white text-sm">Amount (USDC)</label>
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

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CHAIN_NAMES).map(([chainId, name]) => (
            <button
              key={chainId}
              onClick={() => sendUSDC(chainId as keyof typeof CHAIN_TO_USDC_ADDRESS)}
              disabled={isDisabled}
              className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Send on {name}
            </button>
          ))}
        </div>

        <div className="h-6 text-center">
          {txHash && txChainId && (
            <a
              href={`${CHAIN_TO_EXPLORER[txChainId]}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm font-mono"
              data-testid="send-usdc-tx-explorer-link"
            >
              View on {CHAIN_NAMES[txChainId]} Explorer
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
