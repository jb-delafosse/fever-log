import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database path - can be configured via environment variable
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'fever-log.db');

let _db: Database.Database | null = null;

function initializeDatabase(): Database.Database {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create database connection
  const database = new Database(DB_PATH);

  // Enable WAL mode for better concurrent access
  database.pragma('journal_mode = WAL');

  // Initialize schema
  database.exec(`
    -- Events table stores all fever events
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted INTEGER DEFAULT 0,
      data TEXT NOT NULL
    );

    -- Index for sync queries (ordered by updated_at, id for pagination)
    CREATE INDEX IF NOT EXISTS idx_events_sync ON events(updated_at, id);

    -- Index for timestamp queries
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);

    -- Index for type queries
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type, deleted);

    -- Sync clients table tracks last sync checkpoint per client
    CREATE TABLE IF NOT EXISTS sync_clients (
      client_id TEXT PRIMARY KEY,
      last_checkpoint_updated_at INTEGER,
      last_checkpoint_id TEXT,
      last_sync INTEGER
    );
  `);

  return database;
}

// Lazy getter for database connection
function getDb(): Database.Database {
  if (!_db) {
    _db = initializeDatabase();
  }
  return _db;
}

// Export as a proxy to ensure lazy initialization
export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const database = getDb();
    const value = database[prop as keyof Database.Database];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  },
});

export type { Database };
