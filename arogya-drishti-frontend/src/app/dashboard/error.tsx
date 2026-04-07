'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center p-8">
      <div className="max-w-md w-full card p-8 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-critical-light flex items-center justify-center mx-auto">
          <svg className="h-6 w-6 text-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-500 font-mono bg-gray-50 rounded p-3 text-left break-all">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary text-sm px-4 py-2"
          >
            Try again
          </button>
          <a href="/login" className="btn-secondary text-sm px-4 py-2">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
