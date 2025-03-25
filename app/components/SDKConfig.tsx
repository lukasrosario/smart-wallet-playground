import { useConfig } from '../context/ConfigContext';

const KEYS_URL_SHORTCUTS = {
  'https://keys.coinbase.com': 'https://keys.coinbase.com/connect',
  'http://localhost:3005': 'http://localhost:3005/connect',
} as const;

export function SDKConfig() {
  const { appName, appLogoUrl, keysUrl, setAppName, setAppLogoUrl, setKeysUrl } = useConfig();

  return (
    <div className="flex flex-col bg-slate-800 rounded-md p-4">
      <h2 className="text-white mb-2 self-center">SDK Config</h2>
      <label className="flex flex-col text-white text-sm mb-1">
        App Name
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="Smart Wallet Playground"
          className="mt-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
        />
      </label>
      <label className="flex flex-col text-white text-sm mb-1">
        App Logo URL
        <input
          type="text"
          value={appLogoUrl}
          onChange={(e) => setAppLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="mt-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white"
        />
      </label>
      <label className="flex flex-col text-white text-sm mb-1">
        Keys URL
        <div className="grid grid-cols-2 gap-2 mb-2 mt-1">
          {Object.entries(KEYS_URL_SHORTCUTS).map(([label, url]) => (
            <button
              key={url}
              onClick={() => setKeysUrl(url)}
              className="py-2 px-4 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm"
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={keysUrl}
          onChange={(e) => setKeysUrl(e.target.value)}
          placeholder="https://keys.coinbase.com/connect"
          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white font-mono"
        />
      </label>
    </div>
  );
}
