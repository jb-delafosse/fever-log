import type { SymptomEntry } from '@/domain/entities/symptom-entry';
import type { EventRepository } from '@/application/ports/event-repository';

/**
 * Use case for retrieving all symptom entries.
 */
export class GetSymptomEntries {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<SymptomEntry[]> {
    return this.eventRepository.getSymptomEntries();
  }
}
