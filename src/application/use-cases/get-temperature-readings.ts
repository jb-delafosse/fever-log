import type { TemperatureReading } from '@/domain/entities/temperature-reading';
import type { EventRepository } from '@/application/ports/event-repository';

/**
 * Use case for retrieving all temperature readings.
 */
export class GetTemperatureReadings {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<TemperatureReading[]> {
    return this.eventRepository.getTemperatureReadings();
  }
}
