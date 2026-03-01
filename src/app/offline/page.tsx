'use client';

import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
        <p className="text-muted-foreground mb-6">
          This page isn&apos;t available offline. Your logged data is safely stored locally
          and will sync when you&apos;re back online.
        </p>
        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Tip: The home page and logging features work offline!
        </p>
      </div>
    </div>
  );
}
