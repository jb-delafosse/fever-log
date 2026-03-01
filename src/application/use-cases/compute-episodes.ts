import type { Episode } from '@/domain/entities/episode';
import { episodeGrouper } from '@/domain/services/episode-grouper';
import type { EventRepository } from '@/application/ports/event-repository';

/**
 * Use case for computing episodes from all events.
 * Episodes are computed aggregates based on the 48-hour gap rule.
 */
export class ComputeEpisodes {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<Episode[]> {
    // Get all events
    const allEvents = await this.eventRepository.getAll();

    // Filter out deleted events and cast to EpisodeEvent type
    const activeEvents = allEvents.filter((e) => !e._deleted);

    // Use the episode grouper to compute episodes
    return episodeGrouper.group(activeEvents);
  }
}
