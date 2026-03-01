import type { EventRepository, FeverEvent } from '@/application/ports/event-repository';
import type { TemperatureReading } from '@/domain/entities/temperature-reading';
import type { SymptomEntry } from '@/domain/entities/symptom-entry';
import type { TreatmentEntry } from '@/domain/entities/treatment-entry';
import type { DoctorVisit } from '@/domain/entities/doctor-visit';
import type { SpecialEvent } from '@/domain/entities/special-event';
import { db } from './dexie-db';

/**
 * Dexie.js implementation of EventRepository.
 * Uses IndexedDB for local-first storage.
 */
export class DexieEventRepository implements EventRepository {
  async save(event: FeverEvent): Promise<void> {
    await db.events.put(event);
  }

  async getById(id: string): Promise<FeverEvent | undefined> {
    const event = await db.events.get(id);
    return event && !event._deleted ? event : undefined;
  }

  async getAll(): Promise<FeverEvent[]> {
    const allEvents = await db.events.orderBy('timestamp').reverse().toArray();
    return allEvents.filter((e) => !e._deleted);
  }

  async getTemperatureReadings(): Promise<TemperatureReading[]> {
    const events = await db.events
      .where('type')
      .equals('temperature')
      .reverse()
      .sortBy('timestamp');

    return events.filter(
      (e): e is TemperatureReading => e.type === 'temperature' && !e._deleted
    );
  }

  async getSymptomEntries(): Promise<SymptomEntry[]> {
    const events = await db.events
      .where('type')
      .equals('symptom')
      .reverse()
      .sortBy('timestamp');

    return events.filter(
      (e): e is SymptomEntry => e.type === 'symptom' && !e._deleted
    );
  }

  async getTreatmentEntries(): Promise<TreatmentEntry[]> {
    const events = await db.events
      .where('type')
      .equals('treatment')
      .reverse()
      .sortBy('timestamp');

    return events.filter(
      (e): e is TreatmentEntry => e.type === 'treatment' && !e._deleted
    );
  }

  async getDoctorVisits(): Promise<DoctorVisit[]> {
    const events = await db.events
      .where('type')
      .equals('doctor_visit')
      .reverse()
      .sortBy('timestamp');

    return events.filter(
      (e): e is DoctorVisit => e.type === 'doctor_visit' && !e._deleted
    );
  }

  async getSpecialEvents(): Promise<SpecialEvent[]> {
    const events = await db.events
      .where('type')
      .equals('special_event')
      .reverse()
      .sortBy('timestamp');

    return events.filter(
      (e): e is SpecialEvent => e.type === 'special_event' && !e._deleted
    );
  }

  async delete(id: string): Promise<void> {
    const event = await db.events.get(id);
    if (event) {
      await db.events.put({
        ...event,
        _deleted: true,
        updatedAt: new Date(),
      });
    }
  }
}

// Singleton instance
export const eventRepository = new DexieEventRepository();
