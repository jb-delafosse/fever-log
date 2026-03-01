import { createSpecialEvent, type SpecialEventType } from '@/domain/entities/special-event';
import type { EventRepository } from '@/application/ports/event-repository';

export interface LogSpecialEventInput {
  eventType: SpecialEventType;
  description: string;
  photoIds?: string[];
  timestamp?: Date;
  notes?: string;
}

export interface LogSpecialEventOutput {
  id: string;
  eventType: SpecialEventType;
  description: string;
}

/**
 * Use case for logging a special event.
 */
export class LogSpecialEvent {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: LogSpecialEventInput): Promise<LogSpecialEventOutput> {
    // Generate UUID
    const id = crypto.randomUUID();

    // Create the special event entity
    const event = createSpecialEvent(
      id,
      input.eventType,
      input.description,
      input.timestamp ?? new Date(),
      input.photoIds,
      input.notes
    );

    // Persist
    await this.eventRepository.save(event);

    return {
      id,
      eventType: input.eventType,
      description: input.description,
    };
  }
}
