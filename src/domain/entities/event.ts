/**
 * Base event interface - all events extend this.
 * Includes sync-related fields (_deleted, updatedAt).
 */
export interface BaseEvent {
  id: string;           // UUID v4
  timestamp: Date;      // When the event occurred
  createdAt: Date;      // When it was logged
  updatedAt: Date;      // Last modification (for sync)
  _deleted: boolean;    // Soft delete flag (for sync)
  notes?: string;       // Optional notes
}

/**
 * Event types for discriminated union
 */
export type EventType =
  | 'temperature'
  | 'symptom'
  | 'treatment'
  | 'doctor_visit'
  | 'special_event';
