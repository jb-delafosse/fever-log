import type { EventRepository, FeverEvent } from '../ports/event-repository';

export interface ExportDataResult {
  events: FeverEvent[];
  exportedAt: Date;
  totalCount: number;
}

export class ExportData {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<ExportDataResult> {
    const events = await this.eventRepository.getAll();

    // Sort by timestamp (oldest first for chronological export)
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      events: sortedEvents,
      exportedAt: new Date(),
      totalCount: sortedEvents.length,
    };
  }
}

// Convert events to CSV format
export function eventsToCSV(events: FeverEvent[]): string {
  if (events.length === 0) {
    return 'No events to export';
  }

  const headers = [
    'ID',
    'Type',
    'Timestamp',
    'Created At',
    'Notes',
    // Temperature fields
    'Temperature (°C)',
    // Symptom fields
    'Symptom',
    'Severity',
    // Treatment fields
    'Treatment',
    'Dosage',
    'Effectiveness',
    // Doctor visit fields
    'Reason',
    'Outcome',
    'Doctor Name',
    // Special event fields
    'Event Type',
    'Description',
  ];

  const rows = events.map((event) => {
    const base = [
      event.id,
      event.type,
      new Date(event.timestamp).toISOString(),
      new Date(event.createdAt).toISOString(),
      escapeCSV(event.notes || ''),
    ];

    // Add type-specific fields
    switch (event.type) {
      case 'temperature':
        return [...base, event.valueCelsius.toString(), '', '', '', '', '', '', '', '', '', ''];
      case 'symptom':
        return [...base, '', event.symptom, event.severity?.toString() || '', '', '', '', '', '', '', '', ''];
      case 'treatment':
        return [...base, '', '', '', event.treatment, event.dosage || '', event.effectiveness?.toString() || '', '', '', '', '', ''];
      case 'doctor_visit':
        return [...base, '', '', '', '', '', '', event.reason, event.outcome, event.doctorName || '', '', ''];
      case 'special_event':
        return [...base, '', '', '', '', '', '', '', '', '', event.eventType, event.description];
      default:
        return [...base, '', '', '', '', '', '', '', '', '', '', ''];
    }
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

// Convert events to JSON format (pretty printed)
export function eventsToJSON(result: ExportDataResult): string {
  return JSON.stringify(
    {
      exportedAt: result.exportedAt.toISOString(),
      totalCount: result.totalCount,
      events: result.events,
    },
    null,
    2
  );
}

// Helper to escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Trigger file download in browser
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
