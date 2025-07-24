import { useCallback, useState, useMemo, useEffect } from 'react';
import { useSignMessage, useAccount, usePublicClient } from 'wagmi';
import { useWallet } from '../context/WagmiContextProvider';
import { useHydration } from '../hooks/useHydration';
import { Button } from './ui/Button';
import { ConnectWalletPrompt } from './ui/ConnectWalletPrompt';
import { FeatureLayout } from './ui/FeatureLayout';
import type { Hex, Address } from 'viem';
import { isAddress } from 'viem';

export function PersonalSign() {
  const { addLog } = useWallet();
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const isHydrated = useHydration();

  const [message, setMessage] = useState<string>('hello world');

  // Wagmi hooks
  const {
    signMessage,
    data: signature,
    error,
    isPending: isSigningMessage,
    reset: resetSignMessage,
  } = useSignMessage();

  const displayIsConnected = isHydrated && isConnected && address && isAddress(address);

  useEffect(() => {
    // Only reset if we're not on the initial message
    if (message !== 'hello world') {
      resetSignMessage();
    }
  }, [message, resetSignMessage]);

  // Verify signature when we get one
  const verifySignature = useCallback(
    async (signature: Hex) => {
      if (!signature || !address || !publicClient || !message.trim()) return;

      if (!isAddress(address)) {
        addLog({
          type: 'error',
          data: 'Invalid wallet address format',
        });
        return;
      }

      try {
        addLog({
          type: 'message',
          data: 'Verifying signature...',
        });

        const valid = await publicClient.verifyMessage({
          address: address as Address,
          message: message.trim(),
          signature,
          blockTag: 'latest',
        });

        addLog({
          type: 'message',
          data: `Signature verification: ${valid ? 'Valid' : 'Invalid'}`,
        });
      } catch (error) {
        // Better error handling with more specific messages
        let errorMessage = 'Unknown verification error';

        if (error instanceof Error) {
          errorMessage = error.message;

          // Handle common viem verification errors
          if (error.message.includes('Invalid signature')) {
            errorMessage = 'Signature is invalid or malformed';
          } else if (error.message.includes('Contract not deployed')) {
            errorMessage = 'Smart wallet not deployed yet';
          } else if (error.message.includes('Failed to verify')) {
            errorMessage = 'Unable to verify signature - network or wallet issue';
          }
        }

        addLog({
          type: 'error',
          data: `Signature verification failed: ${errorMessage}`,
        });
      }
    },
    [address, publicClient, message, addLog],
  );

  // Handle signature success
  useEffect(() => {
    if (signature) {
      addLog({
        type: 'message',
        data: `Personal sign completed: ${signature}`,
      });
      verifySignature(signature);
    }
  }, [signature, addLog, verifySignature]);

  // Handle signature error
  useEffect(() => {
    if (error) {
      addLog({
        type: 'error',
        data: `Personal sign failed: ${error.message}`,
      });
    }
  }, [error, addLog]);

  // Handle personal sign with better validation
  const handlePersonalSign = useCallback(async () => {
    if (!displayIsConnected || !message.trim()) return;

    const messageToSign = message.trim();

    // Validate message before signing
    if (messageToSign.length === 0) {
      addLog({
        type: 'error',
        data: 'Message cannot be empty',
      });
      return;
    }

    addLog({
      type: 'message',
      data: `Signing message: "${messageToSign}"`,
    });

    try {
      signMessage({ message: messageToSign });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog({
        type: 'error',
        data: `Failed to sign: ${errorMessage}`,
      });
    }
  }, [displayIsConnected, message, signMessage, addLog]);

  const buttonText = useMemo(() => {
    if (!isHydrated) return 'Loading...';
    if (!displayIsConnected) return 'Connect Wallet';
    if (isSigningMessage) return 'Signing...';
    return 'Sign Message';
  }, [isHydrated, displayIsConnected, isSigningMessage]);

  const isButtonDisabled = !displayIsConnected || !message.trim() || isSigningMessage;

  return (
    <FeatureLayout showCard={false}>
      {/* Connection Status */}
      {!displayIsConnected && <ConnectWalletPrompt />}

      {displayIsConnected && (
        <>
          {/* Message Input Section */}
          <div className="space-y-8">
            <div>
              <label className="block text-sm text-white mb-2">Message to sign</label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  className="w-full h-32 px-6 py-4 bg-black border border-gray-700 rounded-2xl text-white placeholder-gray-500 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                />
                <div className="absolute bottom-4 right-4 text-sm text-gray-500">{message.length} characters</div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={handlePersonalSign}
                disabled={isButtonDisabled}
                isLoading={isSigningMessage}
                loadingText="Signing..."
                fullWidth
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </>
      )}
    </FeatureLayout>
  );
}
