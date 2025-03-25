import { useCallback, useMemo, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from 'viem';
import { Switch } from './Switch';

const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const;

const AMOUNT_SHORTCUTS = {
  '1¢': '0.01',
  '10¢': '0.10',
  $1: '1.00',
} as const;

const CHAIN_TO_USDC_ADDRESS = {
  '0x1': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // Mainnet
  '0xa': '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // Optimism
  '0x2105': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  '0xaa36a7': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
} as const;

export function SendUSDC() {
  const { provider, addLog, currentChain, connectedAddress } = useWallet();
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [useSendCalls, setUseSendCalls] = useState(true);
  const [isSponsored, setIsSponsored] = useState(false);

  const currentChainUSDC = currentChain
    ? CHAIN_TO_USDC_ADDRESS[currentChain as keyof typeof CHAIN_TO_USDC_ADDRESS]
    : undefined;

  const isDisabled = useMemo(() => {
    if (!amount) return true;
    if (!toAddress || !isAddress(toAddress)) return true;
    if (!currentChain || !currentChainUSDC) return true;
    if (!connectedAddress && !useSendCalls) return true;
    return false;
  }, [amount, toAddress, currentChain, currentChainUSDC, connectedAddress, useSendCalls]);

  const sendUSDC = useCallback(async () => {
    if (isDisabled) return;

    try {
      if (useSendCalls) {
        await provider?.request({
          method: 'wallet_sendCalls',
          params: [
            {
              version: '1.0',
              chainId: currentChain,
              sponsored: isSponsored,
              calls: [
                {
                  to: currentChainUSDC,
                  data: encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [toAddress as `0x${string}`, parseUnits(amount, 6)],
                  }),
                },
              ],
              capabilities: {
                ...(isSponsored
                  ? {
                      paymasterService: {
                        url: `${document.location.origin}/api/paymaster/${encodeURIComponent('Playground')}`,
                      },
                    }
                  : {}),
              },
            },
          ],
        });
      } else {
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [toAddress as `0x${string}`, parseUnits(amount, 6)],
        });

        await provider?.request({
          method: 'eth_sendTransaction',
          params: [
            {
              to: currentChainUSDC,
              from: connectedAddress,
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
  }, [
    isDisabled,
    useSendCalls,
    provider,
    currentChain,
    isSponsored,
    currentChainUSDC,
    toAddress,
    amount,
    connectedAddress,
    addLog,
  ]);

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <div className="flex flex-col space-y-4">
        <h2 className="text-white self-center">USDC Send</h2>
        <div className="flex flex-col space-y-2 h-12 items-center mt-2">
          <Switch
            checked={useSendCalls}
            onChange={setUseSendCalls}
            leftLabel="eth_sendTransaction"
            rightLabel="wallet_sendCalls"
          />
          <div>
            {useSendCalls && (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSponsored}
                  onChange={(e) => setIsSponsored(e.target.checked)}
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

        <button
          onClick={sendUSDC}
          disabled={isDisabled}
          className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isDisabled ? 'Choose a chain from shortcuts' : 'Send USDC'}
        </button>
      </div>
    </div>
  );
}
