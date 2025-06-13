import { useState, useEffect } from 'react';

/**
 * Hook to safely handle hydration mismatches by tracking client-side mount
 * Returns false during SSR and initial hydration, true after component mounts
 */
export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
