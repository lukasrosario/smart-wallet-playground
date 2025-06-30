'use client';

import { getNavigationStructure, CATEGORY_INFO } from '../../../lib/features/registry';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigationStructure = useMemo(() => getNavigationStructure(), []);
  const pathname = usePathname();

  return (
    <div
      className={`bg-slate-800 border-r border-slate-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!isCollapsed && <h1 className="text-lg font-semibold text-white">Smart Wallet</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigationStructure.map(({ category, displayName, features }) => (
          <div key={category} className="mb-6">
            {/* Category Header */}
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {CATEGORY_INFO[category].icon} {displayName}
                </h2>
              </div>
            )}

            {/* Feature Links */}
            <div className="space-y-1 px-2">
              {features.map((feature) => {
                const isActive = pathname === feature.route;
                return (
                  <Link
                    key={feature.id}
                    href={feature.route}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors group ${
                      isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={isCollapsed ? feature.title : ''}
                  >
                    <span className="text-lg mr-3">{feature.icon}</span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{feature.title}</div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-700 p-4">
        {!isCollapsed && <div className="text-xs text-slate-400">Smart Wallet Playground</div>}
      </div>
    </div>
  );
}
