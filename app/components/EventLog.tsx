import { useEffect, useRef, useState } from 'react';
import { useWallet } from '../context/WAGMIContext';

function getEventTypeColor(type: string) {
  switch (type) {
    case 'connect':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'disconnect':
      return 'text-yellow-400';
    case 'accountsChanged':
      return 'text-purple-400';
    case 'chainChanged':
      return 'text-blue-400';
    default:
      return 'text-white';
  }
}

function formatEventData(data: unknown): string {
  if (typeof data === 'string') {
    try {
      // Try to parse it as JSON in case it's a stringified error
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If it's not JSON, return as is
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
}

export function EventLog() {
  const { eventLogs, clearLogs } = useWallet();
  const [isExpanded, setIsExpanded] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [eventLogs]);

  return (
    <div className="flex flex-col bg-slate-900 rounded-md overflow-hidden">
      <div className="w-full bg-slate-800 border-b border-slate-700 py-4 flex items-center justify-between px-4">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-4 flex-grow cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h2 className="text-white text-lg font-sans">Event Log</h2>
          <span className="text-white text-lg">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <button
          onClick={clearLogs}
          className="px-3 py-1 bg-slate-700 text-white rounded-md border border-slate-600 hover:bg-slate-600 transition-colors text-sm cursor-pointer"
        >
          Clear
        </button>
      </div>
      <div className={`transition-all duration-200 ${isExpanded ? 'h-[400px]' : 'h-0'}`}>
        <div className="h-full overflow-auto p-4 font-mono text-sm" ref={terminalRef}>
          <div className="flex flex-col space-y-2">
            {eventLogs.length === 0 ? (
              <div className="text-gray-500 italic">No events yet. Try connecting your wallet...</div>
            ) : (
              eventLogs.map((log, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className={`font-mono text-sm ${getEventTypeColor(log.type)}`}>{log.type}</span>
                    <span className="text-slate-500 text-sm">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap overflow-x-auto ml-4">
                    {formatEventData(log.data)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
