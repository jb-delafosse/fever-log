import type { SpecialEvent } from '@/domain/entities/special-event';
import type { EventRepository } from '@/application/ports/event-repository';

/**
 * Use case for retrieving all special events.
 */
export class GetSpecialEvents {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<SpecialEvent[]> {
    return this.eventRepository.getSpecialEvents();
  }
}
