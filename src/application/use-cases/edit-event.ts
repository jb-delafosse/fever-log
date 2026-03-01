import type { EventRepository, FeverEvent } from '@/application/ports/event-repository';

export interface EditEventInput {
  id: string;
  updates: Partial<Omit<FeverEvent, 'id' | 'type' | 'createdAt'>>;
}

/**
 * Use case for editing an existing event.
 * Updates the event's fields and sets updatedAt timestamp.
 */
export class EditEvent {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: EditEventInput): Promise<FeverEvent> {
    const event = await this.eventRepository.getById(input.id);

    if (!event) {
      throw new Error(`Event with id ${input.id} not found`);
    }

    if (event._deleted) {
      throw new Error(`Cannot edit deleted event ${input.id}`);
    }

    const updatedEvent: FeverEvent = {
      ...event,
      ...input.updates,
      id: event.id, // Ensure ID cannot be changed
      type: event.type, // Ensure type cannot be changed
      createdAt: event.createdAt, // Ensure createdAt cannot be changed
      updatedAt: new Date(),
    } as FeverEvent;

    await this.eventRepository.save(updatedEvent);

    return updatedEvent;
  }
}
