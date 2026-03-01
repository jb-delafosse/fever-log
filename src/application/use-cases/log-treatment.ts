import { createTreatmentEntry, type TreatmentEffectiveness } from '@/domain/entities/treatment-entry';
import type { EventRepository } from '@/application/ports/event-repository';

export interface LogTreatmentInput {
  treatment: string;
  dosage?: string;
  effectiveness?: TreatmentEffectiveness;
  timestamp?: Date;
  notes?: string;
}

export interface LogTreatmentOutput {
  id: string;
  treatment: string;
  dosage?: string;
  effectiveness?: TreatmentEffectiveness;
}

/**
 * Use case for logging a treatment entry.
 */
export class LogTreatment {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: LogTreatmentInput): Promise<LogTreatmentOutput> {
    // Generate UUID
    const id = crypto.randomUUID();

    // Create the treatment entry entity
    const entry = createTreatmentEntry(
      id,
      input.treatment,
      input.timestamp ?? new Date(),
      input.dosage,
      input.effectiveness,
      input.notes
    );

    // Persist
    await this.eventRepository.save(entry);

    return {
      id,
      treatment: input.treatment,
      dosage: input.dosage,
      effectiveness: input.effectiveness,
    };
  }
}
