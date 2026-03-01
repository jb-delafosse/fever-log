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
 * Port interface for event repository.
 * Follows Clean Architecture - application layer defines the interface,
 * infrastructure layer provides the implementation.
 */
export interface EventRepository {
  /**
   * Save a new event or update an existing one.
   */
  save(event: FeverEvent): Promise<void>;

  /**
   * Get an event by ID.
   */
  getById(id: string): Promise<FeverEvent | undefined>;

  /**
   * Get all non-deleted events, sorted by timestamp descending.
   */
  getAll(): Promise<FeverEvent[]>;

  /**
   * Get all temperature readings, sorted by timestamp descending.
   */
  getTemperatureReadings(): Promise<TemperatureReading[]>;

  /**
   * Get all symptom entries, sorted by timestamp descending.
   */
  getSymptomEntries(): Promise<SymptomEntry[]>;

  /**
   * Get all treatment entries, sorted by timestamp descending.
   */
  getTreatmentEntries(): Promise<TreatmentEntry[]>;

  /**
   * Get all doctor visits, sorted by timestamp descending.
   */
  getDoctorVisits(): Promise<DoctorVisit[]>;

  /**
   * Get all special events, sorted by timestamp descending.
   */
  getSpecialEvents(): Promise<SpecialEvent[]>;

  /**
   * Soft delete an event.
   */
  delete(id: string): Promise<void>;
}
