import { BaseEvent } from './event';

/**
 * Doctor visit event.
 * Records medical consultations including reason, outcome, and doctor information.
 */
export interface DoctorVisit extends BaseEvent {
  type: 'doctor_visit';
  reason: string;
  outcome: string;
  doctorName?: string;
  photoIds?: string[];
}

/**
 * Create a new doctor visit entry.
 */
export function createDoctorVisit(
  id: string,
  reason: string,
  outcome: string,
  timestamp: Date = new Date(),
  doctorName?: string,
  photoIds?: string[],
  notes?: string
): DoctorVisit {
  const now = new Date();
  return {
    id,
    type: 'doctor_visit',
    reason,
    outcome,
    doctorName,
    photoIds,
    timestamp,
    createdAt: now,
    updatedAt: now,
    _deleted: false,
    notes,
  };
}
