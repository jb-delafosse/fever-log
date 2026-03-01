import type { TreatmentEntry } from '@/domain/entities/treatment-entry';
import type { EventRepository } from '@/application/ports/event-repository';

/**
 * Use case for retrieving all treatment entries.
 */
export class GetTreatmentEntries {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<TreatmentEntry[]> {
    return this.eventRepository.getTreatmentEntries();
  }
}
