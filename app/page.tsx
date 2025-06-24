'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/config/sdk');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="text-white">Redirecting to SDK Config...</div>
    </div>
  );
}
