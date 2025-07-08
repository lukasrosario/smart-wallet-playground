import { useConfig } from '../context/ConfigContext';

const KEYS_URL_SHORTCUTS = {
  'https://keys.coinbase.com': 'https://keys.coinbase.com/connect',
  'http://localhost:3005': 'http://localhost:3005/connect',
} as const;

export function SDKConfig() {
  const {
    stagedAppName,
    stagedAppLogoUrl,
    stagedKeysUrl,
    setStagedAppName,
    setStagedAppLogoUrl,
    setStagedKeysUrl,
    applyChanges,
    hasPendingChanges,
  } = useConfig();

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4 justify-between">
      <h2 className="text-white mb-4 self-center">SDK Config</h2>

      <label className="flex flex-col text-white text-sm mb-3">
        App Name
        <input
          type="text"
          value={stagedAppName}
          onChange={(e) => setStagedAppName(e.target.value)}
          placeholder="Smart Wallet Playground"
          className="mt-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
        />
      </label>

      <label className="flex flex-col text-white text-sm mb-3">
        App Logo URL
        <input
          type="text"
          value={stagedAppLogoUrl}
          onChange={(e) => setStagedAppLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="mt-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
        />
      </label>

      <label className="flex flex-col text-white text-sm mb-4">
        Keys URL
        <div className="grid grid-cols-2 gap-2 mb-2 mt-1">
          {Object.entries(KEYS_URL_SHORTCUTS).map(([label, url]) => (
            <button
              key={url}
              onClick={() => setStagedKeysUrl(url)}
              className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={stagedKeysUrl}
          onChange={(e) => setStagedKeysUrl(e.target.value)}
          placeholder="https://keys.coinbase.com/connect"
          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
        />
      </label>

      <button
        onClick={applyChanges}
        disabled={!hasPendingChanges}
        className={`py-3 px-4 rounded-md font-semibold transition-colors ${
          hasPendingChanges
            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
        }`}
      >
        {hasPendingChanges ? 'Apply Changes (Will Reconnect Wallet)' : 'No Changes to Apply'}
      </button>
    </div>
  );
}
