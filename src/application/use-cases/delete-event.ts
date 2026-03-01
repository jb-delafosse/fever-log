import type { EventRepository } from '@/application/ports/event-repository';

export interface DeleteEventInput {
  id: string;
}

/**
 * Use case for deleting an event (soft delete).
 * Sets the _deleted flag to true for sync compatibility.
 */
export class DeleteEvent {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: DeleteEventInput): Promise<void> {
    await this.eventRepository.delete(input.id);
  }
}
