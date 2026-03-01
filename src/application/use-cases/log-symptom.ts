import { createSymptomEntry, type SymptomType, type SymptomSeverity } from '@/domain/entities/symptom-entry';
import type { EventRepository } from '@/application/ports/event-repository';

export interface LogSymptomInput {
  symptom: SymptomType;
  severity?: SymptomSeverity;
  timestamp?: Date;
  notes?: string;
}

export interface LogSymptomOutput {
  id: string;
  symptom: SymptomType;
  severity?: SymptomSeverity;
}

/**
 * Use case for logging a symptom entry.
 */
export class LogSymptom {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: LogSymptomInput): Promise<LogSymptomOutput> {
    // Generate UUID
    const id = crypto.randomUUID();

    // Create the symptom entry entity
    const entry = createSymptomEntry(
      id,
      input.symptom,
      input.timestamp ?? new Date(),
      input.severity,
      input.notes
    );

    // Persist
    await this.eventRepository.save(entry);

    return {
      id,
      symptom: input.symptom,
      severity: input.severity,
    };
  }
}
