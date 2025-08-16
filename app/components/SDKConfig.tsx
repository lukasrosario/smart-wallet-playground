import { useConfig } from '../context/ConfigContext';
import { Button } from './ui/Button';
import { FeatureLayout } from './ui/FeatureLayout';
import { Switch } from './ui/Switch';
import { Input } from './ui/Input';

const WALLET_URL_SHORTCUTS = {
  'https://keys.coinbase.com': 'https://keys.coinbase.com/connect',
  'http://localhost:3005': 'http://localhost:3005/connect',
} as const;

export function SDKConfig() {
  const {
    stagedAppName,
    stagedAppLogoUrl,
    stagedWalletUrl,
    setStagedAppName,
    setStagedAppLogoUrl,
    setStagedWalletUrl,
    applyChanges,
    hasPendingChanges,
  } = useConfig();

  return (
    <FeatureLayout showCard={false}>
      <div className="space-y-6 md:space-y-8">
        <Input
          label="App Name"
          type="text"
          value={stagedAppName}
          onChange={(e) => setStagedAppName(e.target.value)}
          placeholder="Smart Wallet Playground"
        />

        <Input
          label="App Logo URL"
          type="text"
          value={stagedAppLogoUrl}
          onChange={(e) => setStagedAppLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
        />

        <div>
          <Input
            label="Wallet URL"
            type="text"
            value={stagedWalletUrl}
            onChange={(e) => setStagedWalletUrl(e.target.value)}
            placeholder="https://keys.coinbase.com/connect"
          />
          <div className="flex justify-center mt-3 md:mt-4">
            <Switch
              checked={stagedWalletUrl === WALLET_URL_SHORTCUTS['http://localhost:3005']}
              onChange={(checked) => {
                setStagedWalletUrl(
                  checked
                    ? WALLET_URL_SHORTCUTS['http://localhost:3005']
                    : WALLET_URL_SHORTCUTS['https://keys.coinbase.com'],
                );
              }}
              leftLabel="keys.coinbase.com"
              rightLabel="localhost:3005"
              className="scale-100 md:scale-125"
            />
          </div>
        </div>

        {/* Apply Changes Button */}
        <div className="flex flex-col items-center space-y-2">
          <Button onClick={applyChanges} disabled={!hasPendingChanges} fullWidth>
            {hasPendingChanges ? 'Apply Changes' : 'No Changes to Apply'}
          </Button>
          {hasPendingChanges && (
            <p className="text-sm text-red-400/70 text-center">
              You&apos;ll need to reconnect your wallet after applying changes
            </p>
          )}
        </div>
      </div>
    </FeatureLayout>
  );
}
