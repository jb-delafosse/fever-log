import { BaseEvent } from './event';

/**
 * Predefined symptom types for PFAPA tracking.
 * The string union allows for extensibility with custom symptoms.
 */
export type SymptomType =
  | 'sore_throat'
  | 'fatigue'
  | 'stomach_ache'
  | 'coughing'
  | 'nasal_congestion'
  | 'ear_infection'
  | string;

/**
 * Severity levels for symptoms.
 * 1 = mild, 2 = moderate, 3 = severe
 */
export type SymptomSeverity = 1 | 2 | 3;

/**
 * Symptom entry event.
 */
export interface SymptomEntry extends BaseEvent {
  type: 'symptom';
  symptom: SymptomType;
  severity?: SymptomSeverity;
}

/**
 * Create a new symptom entry.
 */
export function createSymptomEntry(
  id: string,
  symptom: SymptomType,
  timestamp: Date = new Date(),
  severity?: SymptomSeverity,
  notes?: string
): SymptomEntry {
  const now = new Date();
  return {
    id,
    type: 'symptom',
    symptom,
    severity,
    timestamp,
    createdAt: now,
    updatedAt: now,
    _deleted: false,
    notes,
  };
}

/**
 * Human-readable labels for symptom types.
 */
export const SYMPTOM_LABELS: Record<string, string> = {
  sore_throat: 'Sore Throat',
  fatigue: 'Fatigue',
  stomach_ache: 'Stomach Ache',
  coughing: 'Coughing',
  nasal_congestion: 'Nasal Congestion',
  ear_infection: 'Ear Infection',
};

/**
 * Human-readable labels for severity levels.
 */
export const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
};

/**
 * Get the display label for a symptom type.
 */
export function getSymptomLabel(symptom: SymptomType): string {
  return SYMPTOM_LABELS[symptom] || symptom;
}

/**
 * Get the display label for a severity level.
 */
export function getSeverityLabel(severity: SymptomSeverity): string {
  return SEVERITY_LABELS[severity];
}
