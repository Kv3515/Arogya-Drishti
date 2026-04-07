/**
 * Client-side root layout wrapper
 * Handles Service Worker registration and connectivity banner
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/syncManager';
import { ConnectivityBanner } from './ConnectivityBanner';

export function RootLayoutClient({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register Service Worker on mount
    registerServiceWorker().catch((err) => {
      console.error('Failed to register Service Worker:', err);
    });
  }, []);

  return (
    <>
      <ConnectivityBanner />
      {children}
    </>
  );
}
