import { createDoctorVisit } from '@/domain/entities/doctor-visit';
import type { EventRepository } from '@/application/ports/event-repository';

export interface LogDoctorVisitInput {
  reason: string;
  outcome: string;
  doctorName?: string;
  photoIds?: string[];
  timestamp?: Date;
  notes?: string;
}

export interface LogDoctorVisitOutput {
  id: string;
  reason: string;
  outcome: string;
  doctorName?: string;
}

/**
 * Use case for logging a doctor visit.
 */
export class LogDoctorVisit {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: LogDoctorVisitInput): Promise<LogDoctorVisitOutput> {
    // Generate UUID
    const id = crypto.randomUUID();

    // Create the doctor visit entity
    const visit = createDoctorVisit(
      id,
      input.reason,
      input.outcome,
      input.timestamp ?? new Date(),
      input.doctorName,
      input.photoIds,
      input.notes
    );

    // Persist
    await this.eventRepository.save(visit);

    return {
      id,
      reason: input.reason,
      outcome: input.outcome,
      doctorName: input.doctorName,
    };
  }
}
