import type { TemperatureReading } from './temperature-reading';
import type { SymptomEntry, SymptomType } from './symptom-entry';
import type { TreatmentEntry } from './treatment-entry';
import type { DoctorVisit } from './doctor-visit';
import type { SpecialEvent } from './special-event';

/**
 * Union type for events that can be part of an episode.
 */
export type EpisodeEvent = TemperatureReading | SymptomEntry | TreatmentEntry | DoctorVisit | SpecialEvent;

/**
 * Episode - a computed aggregate of fever-related events.
 * Episodes are not stored directly; they are computed from events
 * using the 48-hour gap rule.
 */
export interface Episode {
  /** Unique identifier for the episode (generated from first event) */
  id: string;
  /** When the episode started (timestamp of first event) */
  startDate: Date;
  /** When the episode ended (timestamp of last event) */
  endDate: Date;
  /** All events in this episode, sorted by timestamp */
  events: EpisodeEvent[];
  /** Maximum temperature recorded during the episode (in Celsius) */
  maxTemperature: number | null;
  /** Unique symptoms observed during the episode */
  symptoms: SymptomType[];
  /** Unique treatments administered during the episode */
  treatments: string[];
  /** Duration of the episode in hours */
  durationHours: number;
  /** Whether this episode is currently active (no 48h gap yet) */
  isActive: boolean;
}

/**
 * Calculate the duration in hours between two dates.
 */
export function calculateDurationHours(start: Date, end: Date): number {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

/**
 * Check if an episode is currently active (last event within 48 hours).
 */
export function isEpisodeActive(episode: Episode, now: Date = new Date()): boolean {
  const hoursSinceLastEvent = calculateDurationHours(episode.endDate, now);
  return hoursSinceLastEvent < 48;
}
