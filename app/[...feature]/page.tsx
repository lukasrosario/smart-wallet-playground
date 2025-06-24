'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { getFeatureByRoute } from '../../lib/features/registry';

interface FeaturePageProps {
  params: Promise<{
    feature: string[];
  }>;
}

export default function FeaturePage({ params }: FeaturePageProps) {
  const resolvedParams = use(params);

  // Construct the route from the feature segments
  const route = `/${resolvedParams.feature.join('/')}`;

  // Find the feature that matches this route
  const feature = getFeatureByRoute(route);

  if (!feature) {
    notFound();
  }

  // Dynamically render the component
  const FeatureComponent = feature.component;

  return (
    <div className="container mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <FeatureComponent />
      </div>
    </div>
  );
}
