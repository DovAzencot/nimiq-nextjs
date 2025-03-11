'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with ssr: false within a Client Component
const NimiqClientDynamic = dynamic(() => import('./NimiqClient'), {
  ssr: false,
});

export default function NimiqClientWrapper() {
  return <NimiqClientDynamic />;
}
