import { BaseEvent } from './event';

/**
 * Effectiveness rating for treatments.
 * 1 = not effective, 5 = very effective
 */
export type TreatmentEffectiveness = 1 | 2 | 3 | 4 | 5;

/**
 * Treatment entry event.
 */
export interface TreatmentEntry extends BaseEvent {
  type: 'treatment';
  treatment: string;
  dosage?: string;
  effectiveness?: TreatmentEffectiveness;
}

/**
 * Create a new treatment entry.
 */
export function createTreatmentEntry(
  id: string,
  treatment: string,
  timestamp: Date = new Date(),
  dosage?: string,
  effectiveness?: TreatmentEffectiveness,
  notes?: string
): TreatmentEntry {
  const now = new Date();
  return {
    id,
    type: 'treatment',
    treatment,
    dosage,
    effectiveness,
    timestamp,
    createdAt: now,
    updatedAt: now,
    _deleted: false,
    notes,
  };
}

/**
 * Predefined treatments for PFAPA.
 */
export const PREDEFINED_TREATMENTS = [
  { id: 'doliprane', label: 'Doliprane (Paracetamol)', defaultDosage: '500mg' },
  { id: 'antibiotics', label: 'Antibiotics', defaultDosage: '' },
] as const;

/**
 * Human-readable labels for treatments.
 */
export const TREATMENT_LABELS: Record<string, string> = {
  doliprane: 'Doliprane',
  antibiotics: 'Antibiotics',
};

/**
 * Human-readable labels for effectiveness levels.
 */
export const EFFECTIVENESS_LABELS: Record<TreatmentEffectiveness, string> = {
  1: 'Not effective',
  2: 'Slightly effective',
  3: 'Moderately effective',
  4: 'Effective',
  5: 'Very effective',
};

/**
 * Get the display label for a treatment.
 */
export function getTreatmentLabel(treatment: string): string {
  return TREATMENT_LABELS[treatment] || treatment;
}

/**
 * Get the display label for an effectiveness level.
 */
export function getEffectivenessLabel(effectiveness: TreatmentEffectiveness): string {
  return EFFECTIVENESS_LABELS[effectiveness];
}
