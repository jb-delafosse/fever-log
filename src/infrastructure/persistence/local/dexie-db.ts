import Dexie, { type EntityTable } from 'dexie';
import type { TemperatureReading } from '@/domain/entities/temperature-reading';
import type { SymptomEntry } from '@/domain/entities/symptom-entry';
import type { TreatmentEntry } from '@/domain/entities/treatment-entry';
import type { DoctorVisit } from '@/domain/entities/doctor-visit';
import type { SpecialEvent } from '@/domain/entities/special-event';

/**
 * Union type for all fever events (will expand as we add more event types)
 */
export type FeverEvent = TemperatureReading | SymptomEntry | TreatmentEntry | DoctorVisit | SpecialEvent;

/**
 * Local IndexedDB database using Dexie.js
 */
export class FeverLogDB extends Dexie {
  events!: EntityTable<FeverEvent, 'id'>;

  constructor() {
    super('FeverLogDB');

    this.version(1).stores({
      // Primary key is id, indexes on type, timestamp, updatedAt, _deleted
      events: 'id, type, timestamp, updatedAt, _deleted',
    });
  }
}

// Singleton instance
export const db = new FeverLogDB();
