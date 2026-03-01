import type { Episode, EpisodeEvent } from '../entities/episode';
import { calculateDurationHours } from '../entities/episode';
import type { TemperatureReading } from '../entities/temperature-reading';
import type { SymptomEntry, SymptomType } from '../entities/symptom-entry';
import type { TreatmentEntry } from '../entities/treatment-entry';
import type { DoctorVisit } from '../entities/doctor-visit';
import type { SpecialEvent } from '../entities/special-event';

/**
 * Fever threshold in Celsius.
 */
const FEVER_THRESHOLD = 38;

/**
 * Gap in hours that signals the end of an episode.
 */
const EPISODE_GAP_HOURS = 48;

/**
 * Check if a temperature reading indicates fever.
 */
function isFeverTemperature(reading: TemperatureReading): boolean {
  return reading.valueCelsius >= FEVER_THRESHOLD;
}

/**
 * Check if an event is a temperature reading.
 */
function isTemperatureReading(event: EpisodeEvent): event is TemperatureReading {
  return event.type === 'temperature';
}

/**
 * Check if an event is a symptom entry.
 */
function isSymptomEntry(event: EpisodeEvent): event is SymptomEntry {
  return event.type === 'symptom';
}

/**
 * Check if an event is a treatment entry.
 */
function isTreatmentEntry(event: EpisodeEvent): event is TreatmentEntry {
  return event.type === 'treatment';
}

/**
 * Check if an event is a doctor visit.
 */
function isDoctorVisit(event: EpisodeEvent): event is DoctorVisit {
  return event.type === 'doctor_visit';
}

/**
 * Check if an event is a special event.
 */
function isSpecialEvent(event: EpisodeEvent): event is SpecialEvent {
  return event.type === 'special_event';
}

/**
 * EpisodeGrouper - Groups events into episodes using the 48-hour gap rule.
 *
 * Rules:
 * 1. An episode starts when an abnormal temperature (>=38°C) is logged
 * 2. Events are grouped into the same episode if there's no 48-hour gap
 * 3. A gap of >48 hours with normal/no readings starts a new episode
 * 4. Symptoms and treatments are included in the episode they occur during
 */
export class EpisodeGrouper {
  /**
   * Group events into episodes.
   *
   * @param events - All events sorted by timestamp (ascending)
   * @returns Episodes sorted by startDate (descending - most recent first)
   */
  group(events: EpisodeEvent[]): Episode[] {
    if (events.length === 0) {
      return [];
    }

    // Sort events by timestamp ascending
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const episodes: Episode[] = [];
    let currentEpisode: EpisodeEvent[] = [];
    let episodeStarted = false;
    let lastEventTime: Date | null = null;

    for (const event of sortedEvents) {
      const eventTime = new Date(event.timestamp);

      // Check if we need to start a new episode due to gap
      if (lastEventTime) {
        const gapHours = calculateDurationHours(lastEventTime, eventTime);

        if (gapHours >= EPISODE_GAP_HOURS) {
          // Gap detected - finalize current episode if it exists
          if (currentEpisode.length > 0 && episodeStarted) {
            episodes.push(this.createEpisode(currentEpisode));
          }
          currentEpisode = [];
          episodeStarted = false;
        }
      }

      // Check if this event starts an episode (fever temperature)
      if (isTemperatureReading(event) && isFeverTemperature(event)) {
        episodeStarted = true;
      }

      // Add event to current episode if episode has started
      // or if it's a symptom/treatment/doctor visit/special event that might be related
      if (episodeStarted) {
        currentEpisode.push(event);
      } else if (isSymptomEntry(event) || isTreatmentEntry(event) || isDoctorVisit(event) || isSpecialEvent(event)) {
        // Include symptoms/treatments/doctor visits/special events even before fever is detected
        // They might be early warning signs or related to an upcoming episode
        currentEpisode.push(event);
      } else if (isTemperatureReading(event)) {
        // Normal temperature reading - include it for context
        currentEpisode.push(event);
      }

      lastEventTime = eventTime;
    }

    // Finalize the last episode
    if (currentEpisode.length > 0 && episodeStarted) {
      episodes.push(this.createEpisode(currentEpisode));
    }

    // Sort by startDate descending (most recent first)
    return episodes.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  /**
   * Create an Episode from a list of events.
   */
  private createEpisode(events: EpisodeEvent[]): Episode {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const startDate = new Date(sortedEvents[0].timestamp);
    const endDate = new Date(sortedEvents[sortedEvents.length - 1].timestamp);

    // Extract temperature readings and find max
    const temperatureReadings = sortedEvents.filter(isTemperatureReading);
    const maxTemperature = temperatureReadings.length > 0
      ? Math.max(...temperatureReadings.map((r) => r.valueCelsius))
      : null;

    // Extract unique symptoms
    const symptomEntries = sortedEvents.filter(isSymptomEntry);
    const symptoms: SymptomType[] = [...new Set(symptomEntries.map((s) => s.symptom))];

    // Extract unique treatments
    const treatmentEntries = sortedEvents.filter(isTreatmentEntry);
    const treatments: string[] = [...new Set(treatmentEntries.map((t) => t.treatment))];

    // Calculate duration
    const durationHours = calculateDurationHours(startDate, endDate);

    // Check if episode is active (last event within 48 hours of now)
    const now = new Date();
    const hoursSinceLastEvent = calculateDurationHours(endDate, now);
    const isActive = hoursSinceLastEvent < EPISODE_GAP_HOURS;

    // Generate ID from first event
    const id = `episode-${sortedEvents[0].id}`;

    return {
      id,
      startDate,
      endDate,
      events: sortedEvents,
      maxTemperature,
      symptoms,
      treatments,
      durationHours,
      isActive,
    };
  }
}

/**
 * Singleton instance of EpisodeGrouper.
 */
export const episodeGrouper = new EpisodeGrouper();
