// Value Objects
export { Temperature } from './value-objects/temperature';

// Entities
export type { BaseEvent, EventType } from './entities/event';
export type { TemperatureReading } from './entities/temperature-reading';
export { createTemperatureReading, isFever } from './entities/temperature-reading';
export type { SymptomEntry, SymptomType, SymptomSeverity } from './entities/symptom-entry';
export {
  createSymptomEntry,
  getSymptomLabel,
  getSeverityLabel,
  SYMPTOM_LABELS,
  SEVERITY_LABELS,
} from './entities/symptom-entry';
export type { TreatmentEntry, TreatmentEffectiveness } from './entities/treatment-entry';
export {
  createTreatmentEntry,
  getTreatmentLabel,
  getEffectivenessLabel,
  PREDEFINED_TREATMENTS,
  TREATMENT_LABELS,
  EFFECTIVENESS_LABELS,
} from './entities/treatment-entry';
export type { DoctorVisit } from './entities/doctor-visit';
export { createDoctorVisit } from './entities/doctor-visit';
export type { SpecialEvent, SpecialEventType } from './entities/special-event';
export {
  createSpecialEvent,
  getSpecialEventTypeLabel,
  SPECIAL_EVENT_TYPE_LABELS,
} from './entities/special-event';
export type { Episode, EpisodeEvent } from './entities/episode';
export { calculateDurationHours, isEpisodeActive } from './entities/episode';

// Services
export { EpisodeGrouper, episodeGrouper } from './services/episode-grouper';
