'use client';

import { useSync } from '@/presentation/hooks/use-sync';
import { cn } from '@/lib/utils';

/**
 * Visual indicator showing sync status.
 * Shows: idle (green), syncing (blue/animated), error (red), offline (gray)
 */
export function SyncStatusIndicator() {
  const { status, isOnline, sync } = useSync();

  const statusConfig = {
    idle: {
      color: 'bg-green-500',
      label: 'Synced',
      animate: false,
    },
    syncing: {
      color: 'bg-blue-500',
      label: 'Syncing...',
      animate: true,
    },
    error: {
      color: 'bg-red-500',
      label: 'Sync error',
      animate: false,
    },
    offline: {
      color: 'bg-gray-400',
      label: 'Offline',
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={sync}
      disabled={status === 'syncing'}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed"
      title={`${config.label}${!isOnline ? ' - No internet connection' : ''}`}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  );
}
