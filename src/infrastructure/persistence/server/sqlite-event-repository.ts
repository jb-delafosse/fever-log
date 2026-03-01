import { db } from './sqlite-db';
import type { FeverEvent } from '@/application/ports/event-repository';

interface EventRow {
  id: string;
  type: string;
  timestamp: number;
  created_at: number;
  updated_at: number;
  deleted: number;
  data: string;
}

interface SyncCheckpoint {
  updatedAt: number;
  id: string;
}

// Convert database row to FeverEvent
function rowToEvent(row: EventRow): FeverEvent {
  const data = JSON.parse(row.data);
  return {
    ...data,
    id: row.id,
    type: row.type,
    timestamp: new Date(row.timestamp),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    _deleted: row.deleted === 1,
  } as FeverEvent;
}

// Convert FeverEvent to database row values
function eventToRow(event: FeverEvent): EventRow {
  const { id, type, timestamp, createdAt, updatedAt, _deleted, ...rest } = event;
  return {
    id,
    type,
    timestamp: new Date(timestamp).getTime(),
    created_at: new Date(createdAt).getTime(),
    updated_at: new Date(updatedAt || new Date()).getTime(),
    deleted: _deleted ? 1 : 0,
    data: JSON.stringify(rest),
  };
}

export class SqliteEventRepository {
  // Get event by ID
  getById(id: string): FeverEvent | null {
    const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const row = stmt.get(id) as EventRow | undefined;
    return row ? rowToEvent(row) : null;
  }

  // Get all non-deleted events
  getAll(): FeverEvent[] {
    const stmt = db.prepare('SELECT * FROM events WHERE deleted = 0 ORDER BY timestamp DESC');
    const rows = stmt.all() as EventRow[];
    return rows.map(rowToEvent);
  }

  // Get events by type
  getByType(type: string): FeverEvent[] {
    const stmt = db.prepare('SELECT * FROM events WHERE type = ? AND deleted = 0 ORDER BY timestamp DESC');
    const rows = stmt.all(type) as EventRow[];
    return rows.map(rowToEvent);
  }

  // Save event (insert or update)
  save(event: FeverEvent): void {
    const row = eventToRow(event);
    const stmt = db.prepare(`
      INSERT INTO events (id, type, timestamp, created_at, updated_at, deleted, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        timestamp = excluded.timestamp,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted,
        data = excluded.data
    `);
    stmt.run(row.id, row.type, row.timestamp, row.created_at, row.updated_at, row.deleted, row.data);
  }

  // Soft delete event
  delete(id: string): void {
    const now = Date.now();
    const stmt = db.prepare('UPDATE events SET deleted = 1, updated_at = ? WHERE id = ?');
    stmt.run(now, id);
  }

  // Get changes since checkpoint (for sync pull)
  getChangesSince(checkpoint: SyncCheckpoint | null, limit: number = 100): {
    events: FeverEvent[];
    checkpoint: SyncCheckpoint | null;
    hasMore: boolean;
  } {
    let stmt;
    let rows: EventRow[];

    if (!checkpoint) {
      // First sync - get all events ordered by updated_at, id
      stmt = db.prepare(`
        SELECT * FROM events
        ORDER BY updated_at ASC, id ASC
        LIMIT ?
      `);
      rows = stmt.all(limit + 1) as EventRow[];
    } else {
      // Subsequent sync - get events updated after checkpoint
      stmt = db.prepare(`
        SELECT * FROM events
        WHERE (updated_at > ?) OR (updated_at = ? AND id > ?)
        ORDER BY updated_at ASC, id ASC
        LIMIT ?
      `);
      rows = stmt.all(checkpoint.updatedAt, checkpoint.updatedAt, checkpoint.id, limit + 1) as EventRow[];
    }

    const hasMore = rows.length > limit;
    const resultRows = hasMore ? rows.slice(0, limit) : rows;
    const events = resultRows.map(rowToEvent);

    // Calculate new checkpoint from last event
    let newCheckpoint: SyncCheckpoint | null = null;
    if (resultRows.length > 0) {
      const lastRow = resultRows[resultRows.length - 1];
      newCheckpoint = {
        updatedAt: lastRow.updated_at,
        id: lastRow.id,
      };
    }

    return {
      events,
      checkpoint: newCheckpoint,
      hasMore,
    };
  }

  // Batch save events (for sync push)
  saveMany(events: FeverEvent[]): { saved: number; conflicts: string[] } {
    const conflicts: string[] = [];
    let saved = 0;

    const insertStmt = db.prepare(`
      INSERT INTO events (id, type, timestamp, created_at, updated_at, deleted, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        timestamp = excluded.timestamp,
        updated_at = excluded.updated_at,
        deleted = excluded.deleted,
        data = excluded.data
      WHERE excluded.updated_at > events.updated_at
    `);

    const transaction = db.transaction(() => {
      for (const event of events) {
        const row = eventToRow(event);
        const result = insertStmt.run(
          row.id, row.type, row.timestamp, row.created_at, row.updated_at, row.deleted, row.data
        );
        if (result.changes > 0) {
          saved++;
        } else {
          // No changes means the server version was newer (conflict)
          conflicts.push(event.id);
        }
      }
    });

    transaction();

    return { saved, conflicts };
  }

  // Update client checkpoint
  updateClientCheckpoint(clientId: string, checkpoint: SyncCheckpoint): void {
    const stmt = db.prepare(`
      INSERT INTO sync_clients (client_id, last_checkpoint_updated_at, last_checkpoint_id, last_sync)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(client_id) DO UPDATE SET
        last_checkpoint_updated_at = excluded.last_checkpoint_updated_at,
        last_checkpoint_id = excluded.last_checkpoint_id,
        last_sync = excluded.last_sync
    `);
    stmt.run(clientId, checkpoint.updatedAt, checkpoint.id, Date.now());
  }

  // Get client checkpoint
  getClientCheckpoint(clientId: string): SyncCheckpoint | null {
    const stmt = db.prepare('SELECT * FROM sync_clients WHERE client_id = ?');
    const row = stmt.get(clientId) as { last_checkpoint_updated_at: number; last_checkpoint_id: string } | undefined;
    if (!row || !row.last_checkpoint_updated_at) {
      return null;
    }
    return {
      updatedAt: row.last_checkpoint_updated_at,
      id: row.last_checkpoint_id,
    };
  }
}

// Singleton instance
export const sqliteEventRepository = new SqliteEventRepository();
