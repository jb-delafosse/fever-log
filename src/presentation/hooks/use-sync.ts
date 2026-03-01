'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncEngine, type SyncStatus } from '@/infrastructure/sync/sync-engine';

interface UseSyncResult {
  status: SyncStatus;
  message: string | undefined;
  sync: () => Promise<void>;
  isOnline: boolean;
}

/**
 * Hook for managing sync state and triggering manual syncs.
 */
export function useSync(): UseSyncResult {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [message, setMessage] = useState<string | undefined>();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Subscribe to sync status changes
    const unsubscribe = syncEngine.subscribe((newStatus, newMessage) => {
      setStatus(newStatus);
      setMessage(newMessage);
    });

    // Start auto sync (every 30 seconds)
    syncEngine.startAutoSync(30000);

    // Listen to online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      syncEngine.stopAutoSync();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sync = useCallback(async () => {
    try {
      await syncEngine.sync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  }, []);

  return { status, message, sync, isOnline };
}
