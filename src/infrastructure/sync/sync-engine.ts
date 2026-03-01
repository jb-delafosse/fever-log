import { db } from '../persistence/local/dexie-db';
import type { FeverEvent } from '@/application/ports/event-repository';

interface SyncCheckpoint {
  updatedAt: number;
  id: string;
}

interface PullResponse {
  events: FeverEvent[];
  checkpoint: SyncCheckpoint | null;
  hasMore: boolean;
}

interface PushResponse {
  saved: number;
  conflicts: string[];
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

type SyncListener = (status: SyncStatus, message?: string) => void;

const SYNC_CHECKPOINT_KEY = 'fever-log-sync-checkpoint';
const CLIENT_ID_KEY = 'fever-log-client-id';
const LAST_PUSH_KEY = 'fever-log-last-push';

/**
 * Client-side sync engine for synchronizing local IndexedDB with server SQLite.
 * Uses checkpoint-based sync with last-write-wins conflict resolution.
 */
export class SyncEngine {
  private clientId: string;
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatus = 'idle';
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.clientId = this.getOrCreateClientId();
  }

  private getOrCreateClientId(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }

    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  private getCheckpoint(): SyncCheckpoint | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(SYNC_CHECKPOINT_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private saveCheckpoint(checkpoint: SyncCheckpoint): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SYNC_CHECKPOINT_KEY, JSON.stringify(checkpoint));
  }

  private getLastPushTime(): number {
    if (typeof window === 'undefined') return 0;

    const stored = localStorage.getItem(LAST_PUSH_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  private saveLastPushTime(time: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_PUSH_KEY, time.toString());
  }

  private setStatus(status: SyncStatus, message?: string): void {
    this.status = status;
    this.listeners.forEach((listener) => listener(status, message));
  }

  /**
   * Subscribe to sync status changes.
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current status
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync status.
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Pull changes from server and merge into local database.
   */
  async pull(): Promise<{ pulled: number; hasMore: boolean }> {
    const checkpoint = this.getCheckpoint();

    try {
      const response = await fetch('/api/sync/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          checkpoint,
          limit: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status}`);
      }

      const data: PullResponse = await response.json();

      // Merge events into local database
      // Use last-write-wins: only update if server version is newer
      for (const serverEvent of data.events) {
        const localEvent = await db.events.get(serverEvent.id);

        const serverUpdatedAt = new Date(serverEvent.updatedAt).getTime();
        const localUpdatedAt = localEvent ? new Date(localEvent.updatedAt).getTime() : 0;

        if (!localEvent || serverUpdatedAt > localUpdatedAt) {
          // Server version is newer, update local
          await db.events.put({
            ...serverEvent,
            // Ensure dates are Date objects
            timestamp: new Date(serverEvent.timestamp),
            createdAt: new Date(serverEvent.createdAt),
            updatedAt: new Date(serverEvent.updatedAt),
          });
        }
      }

      // Save new checkpoint
      if (data.checkpoint) {
        this.saveCheckpoint(data.checkpoint);
      }

      return { pulled: data.events.length, hasMore: data.hasMore };
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      throw error;
    }
  }

  /**
   * Push local changes to server.
   */
  async push(): Promise<{ pushed: number; conflicts: number }> {
    const lastPushTime = this.getLastPushTime();

    // Get all events updated since last push
    const localEvents = await db.events
      .where('updatedAt')
      .above(new Date(lastPushTime))
      .toArray();

    if (localEvents.length === 0) {
      return { pushed: 0, conflicts: 0 };
    }

    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          events: localEvents,
        }),
      });

      if (!response.ok) {
        throw new Error(`Push failed: ${response.status}`);
      }

      const data: PushResponse = await response.json();

      // Update last push time
      this.saveLastPushTime(Date.now());

      return { pushed: data.saved, conflicts: data.conflicts.length };
    } catch (error) {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      throw error;
    }
  }

  /**
   * Perform full sync (push then pull).
   */
  async sync(): Promise<{ pushed: number; pulled: number; conflicts: number }> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return { pushed: 0, pulled: 0, conflicts: 0 };
    }

    this.setStatus('syncing');

    try {
      // Push first, then pull
      const pushResult = await this.push();

      let totalPulled = 0;
      let hasMore = true;

      // Pull in batches until no more changes
      while (hasMore) {
        const pullResult = await this.pull();
        totalPulled += pullResult.pulled;
        hasMore = pullResult.hasMore;
      }

      this.setStatus('idle');

      return {
        pushed: pushResult.pushed,
        pulled: totalPulled,
        conflicts: pushResult.conflicts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message === 'offline') {
        this.setStatus('offline');
      } else {
        this.setStatus('error', message);
      }

      throw error;
    }
  }

  /**
   * Start automatic sync at interval (in milliseconds).
   */
  startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();

    // Initial sync
    this.sync().catch(console.error);

    // Periodic sync
    this.syncInterval = setInterval(() => {
      this.sync().catch(console.error);
    }, intervalMs);

    // Sync when coming back online
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Stop automatic sync.
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.setStatus('idle');
    this.sync().catch(console.error);
  };

  private handleOffline = (): void => {
    this.setStatus('offline');
  };
}

// Singleton instance
export const syncEngine = new SyncEngine();
