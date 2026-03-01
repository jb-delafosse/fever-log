import { BaseEvent } from './event';

/**
 * Type of special event.
 */
export type SpecialEventType = 'surgery' | 'hospitalization' | 'other';

/**
 * Special event entity.
 * Records significant medical events like surgeries, hospitalizations, etc.
 */
export interface SpecialEvent extends BaseEvent {
  type: 'special_event';
  eventType: SpecialEventType;
  description: string;
  photoIds?: string[];
}

/**
 * Create a new special event entry.
 */
export function createSpecialEvent(
  id: string,
  eventType: SpecialEventType,
  description: string,
  timestamp: Date = new Date(),
  photoIds?: string[],
  notes?: string
): SpecialEvent {
  const now = new Date();
  return {
    id,
    type: 'special_event',
    eventType,
    description,
    photoIds,
    timestamp,
    createdAt: now,
    updatedAt: now,
    _deleted: false,
    notes,
  };
}

/**
 * Human-readable labels for special event types.
 */
export const SPECIAL_EVENT_TYPE_LABELS: Record<SpecialEventType, string> = {
  surgery: 'Surgery',
  hospitalization: 'Hospitalization',
  other: 'Other',
};

/**
 * Get the display label for a special event type.
 */
export function getSpecialEventTypeLabel(eventType: SpecialEventType): string {
  return SPECIAL_EVENT_TYPE_LABELS[eventType];
}
