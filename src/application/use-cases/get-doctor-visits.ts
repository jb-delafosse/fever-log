import type { DoctorVisit } from '@/domain/entities/doctor-visit';
import type { EventRepository } from '@/application/ports/event-repository';

/**
 * Use case for retrieving all doctor visits.
 */
export class GetDoctorVisits {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<DoctorVisit[]> {
    return this.eventRepository.getDoctorVisits();
  }
}
