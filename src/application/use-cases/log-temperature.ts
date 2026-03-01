import { createTemperatureReading } from '@/domain/entities/temperature-reading';
import { Temperature } from '@/domain/value-objects/temperature';
import type { EventRepository } from '@/application/ports/event-repository';

export interface LogTemperatureInput {
  value: number;
  unit: 'C' | 'F';
  timestamp?: Date;
  notes?: string;
}

export interface LogTemperatureOutput {
  id: string;
  valueCelsius: number;
  isFever: boolean;
}

/**
 * Use case for logging a temperature reading.
 */
export class LogTemperature {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: LogTemperatureInput): Promise<LogTemperatureOutput> {
    // Convert to Temperature value object for validation and conversion
    const temperature = new Temperature(input.value, input.unit);
    const valueCelsius = temperature.toCelsius();

    // Generate UUID
    const id = crypto.randomUUID();

    // Create the temperature reading entity
    const reading = createTemperatureReading(
      id,
      valueCelsius,
      input.timestamp ?? new Date(),
      input.notes
    );

    // Persist
    await this.eventRepository.save(reading);

    return {
      id,
      valueCelsius,
      isFever: temperature.isAbnormal(),
    };
  }
}
