import { BaseEvent } from './event';

/**
 * Temperature reading event.
 * Stores temperature in Celsius internally.
 */
export interface TemperatureReading extends BaseEvent {
  type: 'temperature';
  valueCelsius: number;
}

/**
 * Create a new temperature reading.
 */
export function createTemperatureReading(
  id: string,
  valueCelsius: number,
  timestamp: Date = new Date(),
  notes?: string
): TemperatureReading {
  const now = new Date();
  return {
    id,
    type: 'temperature',
    valueCelsius,
    timestamp,
    createdAt: now,
    updatedAt: now,
    _deleted: false,
    notes,
  };
}

/**
 * Check if a temperature reading indicates fever.
 */
export function isFever(
  reading: TemperatureReading,
  threshold: number = 38
): boolean {
  return reading.valueCelsius >= threshold;
}
