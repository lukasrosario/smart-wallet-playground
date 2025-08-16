'use client';

import { getNavigationStructure, CATEGORY_INFO } from '../../../lib/features/registry';
import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const navigationStructure = useMemo(() => getNavigationStructure(), []);
  const pathname = usePathname();

  return (
    <>
      <div className={`bg-black border-r border-gray-700 transition-all duration-300 overflow-visible w-16 lg:w-64`}>
        {/* Sidebar Header */}
        <div className="flex items-center p-6">
          <h1 className="text-xl font-bold text-white tracking-tight hidden lg:block">Base Account Playground</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-visible py-6">
          {navigationStructure.map(({ category, displayName, features }) => (
            <div key={category} className="mb-8">
              {/* Category Header */}
              <div className="px-6 mb-4 hidden lg:block">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                  {(() => {
                    const IconComponent = CATEGORY_INFO[category].icon;
                    return <IconComponent className="w-4 h-4 mr-2" />;
                  })()}
                  {displayName}
                </h2>
              </div>

              {/* Feature Links */}
              <div className="space-y-2">
                {features.map((feature) => {
                  const isActive = pathname === feature.route;

                  return (
                    <Link
                      key={feature.id}
                      href={feature.route}
                      className={`flex items-center transition-all group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 py-3 justify-center lg:justify-start lg:px-4'
                          : 'text-white hover:bg-gray-900/50 px-2 py-2 mx-2 rounded-lg justify-center lg:px-4 lg:py-3 lg:mx-4 lg:rounded-2xl lg:justify-start'
                      }`}
                    >
                      <span className="text-lg mr-0 lg:mr-3">
                        {(() => {
                          const IconComponent = feature.icon;
                          return <IconComponent className="w-5 h-5 text-current" />;
                        })()}
                      </span>
                      <div className="flex-1 min-w-0 hidden lg:block">
                        <div className="text-sm font-semibold truncate">{feature.title}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
