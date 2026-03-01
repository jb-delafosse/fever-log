import type { EventRepository, FeverEvent } from '../ports/event-repository';

export interface ImportDataInput {
  jsonContent: string;
  mode: 'merge' | 'replace';
}

export interface ImportDataResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

interface ExportedData {
  exportedAt?: string;
  totalCount?: number;
  events: unknown[];
}

// Validate that an object is a valid FeverEvent
function isValidEvent(obj: unknown): obj is FeverEvent {
  if (typeof obj !== 'object' || obj === null) return false;

  const event = obj as Record<string, unknown>;

  // Check required base fields
  if (typeof event.id !== 'string') return false;
  if (typeof event.type !== 'string') return false;
  if (!event.timestamp) return false;
  if (!event.createdAt) return false;

  // Check type-specific fields
  switch (event.type) {
    case 'temperature':
      return typeof event.valueCelsius === 'number';
    case 'symptom':
      return typeof event.symptom === 'string';
    case 'treatment':
      return typeof event.treatment === 'string';
    case 'doctor_visit':
      return typeof event.reason === 'string' && typeof event.outcome === 'string';
    case 'special_event':
      return typeof event.eventType === 'string' && typeof event.description === 'string';
    default:
      return false;
  }
}

// Normalize event dates (convert strings to Date objects)
function normalizeEvent(event: FeverEvent): FeverEvent {
  return {
    ...event,
    timestamp: new Date(event.timestamp),
    createdAt: new Date(event.createdAt),
    updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
  };
}

export class ImportData {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(input: ImportDataInput): Promise<ImportDataResult> {
    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    // Parse JSON
    let data: ExportedData;
    try {
      data = JSON.parse(input.jsonContent);
    } catch {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: ['Invalid JSON format'],
      };
    }

    // Validate structure
    if (!data.events || !Array.isArray(data.events)) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: ['Invalid export format: missing events array'],
      };
    }

    // If replace mode, get existing IDs to clear them
    if (input.mode === 'replace') {
      const existingEvents = await this.eventRepository.getAll();
      for (const event of existingEvents) {
        await this.eventRepository.delete(event.id);
      }
    }

    // Get existing event IDs for merge mode
    const existingIds = new Set<string>();
    if (input.mode === 'merge') {
      const existingEvents = await this.eventRepository.getAll();
      existingEvents.forEach(e => existingIds.add(e.id));
    }

    // Process each event
    for (let i = 0; i < data.events.length; i++) {
      const rawEvent = data.events[i];

      // Validate event
      if (!isValidEvent(rawEvent)) {
        errors.push(`Event at index ${i}: Invalid event structure`);
        skippedCount++;
        continue;
      }

      // Skip if already exists in merge mode
      if (input.mode === 'merge' && existingIds.has(rawEvent.id)) {
        skippedCount++;
        continue;
      }

      // Normalize and save
      try {
        const normalizedEvent = normalizeEvent(rawEvent);
        await this.eventRepository.save(normalizedEvent);
        importedCount++;
      } catch (err) {
        errors.push(`Event at index ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        skippedCount++;
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      skippedCount,
      errors,
    };
  }
}
