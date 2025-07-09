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
      className={`bg-black border-r border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-16 lg:w-64'}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-6">
        {!isCollapsed && <h1 className="text-xl font-bold text-white tracking-tight hidden lg:block">Smart Wallet</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-gray-900/50 text-gray-400 hover:text-white transition-all cursor-pointer hidden lg:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        {navigationStructure.map(({ category, displayName, features }) => (
          <div key={category} className="mb-8">
            {/* Category Header */}
            {!isCollapsed && (
              <div className="px-6 mb-4 hidden lg:block">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {CATEGORY_INFO[category].icon} {displayName}
                </h2>
              </div>
            )}

            {/* Feature Links */}
            <div className="space-y-2">
              {features.map((feature) => {
                const isActive = pathname === feature.route;
                return (
                  <Link
                    key={feature.id}
                    href={feature.route}
                    className={`flex items-center transition-all group ${
                      isActive
                        ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 ${
                            isCollapsed ? 'py-3 justify-center' : 'py-3 justify-center lg:justify-start lg:px-4'
                          }`
                        : `text-gray-300 hover:bg-gray-900/50 hover:text-white ${
                            isCollapsed
                              ? 'px-2 py-2 mx-2 rounded-lg justify-center'
                              : 'px-2 py-2 mx-2 rounded-lg justify-center lg:px-4 lg:py-3 lg:mx-4 lg:rounded-2xl lg:justify-start'
                          }`
                    }`}
                    title={isCollapsed ? feature.title : ''}
                  >
                    <span className={`text-lg ${isCollapsed ? 'mr-0' : 'mr-0 lg:mr-3'}`}>{feature.icon}</span>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 hidden lg:block">
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
    </div>
  );
}
