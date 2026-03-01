'use client';

import { forwardRef } from 'react';
import type { Episode } from '@/domain/entities/episode';
import type { ReportStatistics } from '@/application';
import { getSymptomLabel, getSeverityLabel } from '@/domain/entities/symptom-entry';
import { getTreatmentLabel, getEffectivenessLabel } from '@/domain/entities/treatment-entry';
import { getSpecialEventTypeLabel } from '@/domain/entities/special-event';
import { FeverCalendarHeatmap } from './fever-calendar-heatmap';

interface PrintableReportProps {
  statistics: ReportStatistics;
  episodes: Episode[];
  feverDays: string[];
  patientName?: string;
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  function PrintableReport({ statistics, episodes, feverDays, patientName }, ref) {
    const today = new Date().toLocaleDateString('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Sort episodes by start date (most recent first)
    const sortedEpisodes = [...episodes].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    return (
      <div ref={ref} className="print-report bg-white text-black p-8">
        {/* Header */}
        <header className="mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">Fever Episode Report</h1>
          {patientName && (
            <p className="text-lg mt-1">Patient: {patientName}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Generated: {today}
          </p>
        </header>

        {/* Summary Section */}
        <section className="mb-6 print-avoid-break">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
            Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Total Episodes:</strong> {statistics.totalEpisodes}</p>
              <p><strong>Episodes (Last 30 Days):</strong> {statistics.episodesLast30Days}</p>
              <p><strong>Episodes (Last 90 Days):</strong> {statistics.episodesLast90Days}</p>
            </div>
            <div>
              {statistics.averageDurationHours !== null && (
                <p><strong>Avg Duration:</strong> {statistics.averageDurationHours} hours</p>
              )}
              {statistics.maxTemperatureEver !== null && (
                <p><strong>Highest Temperature:</strong> <span className="print-fever">{statistics.maxTemperatureEver}°C</span></p>
              )}
              {statistics.averageMaxTemperature !== null && (
                <p><strong>Avg Max Temperature:</strong> {statistics.averageMaxTemperature}°C</p>
              )}
            </div>
          </div>
        </section>

        {/* Fever Calendar */}
        {feverDays.length > 0 && (
          <section className="mb-6 print-avoid-break print-calendar">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
              Fever Calendar (Last 12 Months)
            </h2>
            <FeverCalendarHeatmap feverDays={feverDays} />
          </section>
        )}

        {/* Symptom Summary */}
        {statistics.symptomFrequencies.length > 0 && (
          <section className="mb-6 print-avoid-break">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
              Common Symptoms
            </h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Symptom</th>
                  <th>Occurrences</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {statistics.symptomFrequencies.slice(0, 8).map((item) => (
                  <tr key={item.symptom}>
                    <td>{getSymptomLabel(item.symptom)}</td>
                    <td>{item.count}</td>
                    <td>{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Treatment Summary */}
        {statistics.treatmentEffectiveness.length > 0 && (
          <section className="mb-6 print-avoid-break">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
              Treatments Used
            </h2>
            <table className="print-table">
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Uses</th>
                  <th>Avg Effectiveness</th>
                </tr>
              </thead>
              <tbody>
                {statistics.treatmentEffectiveness.map((item) => (
                  <tr key={item.treatment}>
                    <td>{getTreatmentLabel(item.treatment)}</td>
                    <td>{item.totalUses}</td>
                    <td>
                      {item.averageEffectiveness !== null
                        ? getEffectivenessLabel(Math.round(item.averageEffectiveness) as 1 | 2 | 3 | 4 | 5)
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Episode Details */}
        <section className="print-break-before">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-1">
            Episode Details
          </h2>

          {sortedEpisodes.length === 0 ? (
            <p className="text-gray-600">No episodes recorded.</p>
          ) : (
            <div className="space-y-4">
              {sortedEpisodes.map((episode, index) => (
                <EpisodeDetail
                  key={episode.id}
                  episode={episode}
                  index={sortedEpisodes.length - index}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
          <p>This report was generated by Fever Log - A PFAPA fever tracking application.</p>
          <p>Report Date: {today}</p>
        </footer>
      </div>
    );
  }
);

interface EpisodeDetailProps {
  episode: Episode;
  index: number;
}

function EpisodeDetail({ episode, index }: EpisodeDetailProps) {
  const startDate = new Date(episode.startDate).toLocaleDateString('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const endDate = new Date(episode.endDate).toLocaleDateString('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Sort events by timestamp
  const sortedEvents = [...episode.events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="print-episode">
      <h3 className="font-bold text-base mb-2">
        Episode #{index} {episode.isActive && <span className="text-red-600">(Active)</span>}
      </h3>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <p><strong>Start:</strong> {startDate}</p>
        <p><strong>End:</strong> {endDate}</p>
        <p><strong>Duration:</strong> {episode.durationHours} hours</p>
        {episode.maxTemperature && (
          <p>
            <strong>Max Temp:</strong>{' '}
            <span className="print-fever">{episode.maxTemperature}°C</span>
          </p>
        )}
      </div>

      {episode.symptoms.length > 0 && (
        <p className="text-sm mb-2">
          <strong>Symptoms:</strong> {episode.symptoms.map(s => getSymptomLabel(s)).join(', ')}
        </p>
      )}

      {episode.treatments.length > 0 && (
        <p className="text-sm mb-2">
          <strong>Treatments:</strong> {episode.treatments.map(t => getTreatmentLabel(t)).join(', ')}
        </p>
      )}

      {/* Event Log */}
      <div className="mt-3">
        <p className="font-semibold text-sm mb-1">Event Log:</p>
        <div className="text-xs">
          {sortedEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface EventRowProps {
  event: Episode['events'][number];
}

function EventRow({ event }: EventRowProps) {
  const timestamp = new Date(event.timestamp).toLocaleString('default', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let content: string;
  let isFever = false;

  switch (event.type) {
    case 'temperature':
      content = `Temperature: ${event.valueCelsius}°C`;
      isFever = event.valueCelsius >= 38;
      break;
    case 'symptom':
      content = `Symptom: ${getSymptomLabel(event.symptom)}`;
      if (event.severity) {
        content += ` (${getSeverityLabel(event.severity)})`;
      }
      break;
    case 'treatment':
      content = `Treatment: ${getTreatmentLabel(event.treatment)}`;
      if (event.dosage) {
        content += ` - ${event.dosage}`;
      }
      if (event.effectiveness) {
        content += ` (${getEffectivenessLabel(event.effectiveness)})`;
      }
      break;
    case 'doctor_visit':
      content = `Doctor Visit: ${event.reason}`;
      if (event.doctorName) {
        content += ` (Dr. ${event.doctorName})`;
      }
      break;
    case 'special_event':
      content = `${getSpecialEventTypeLabel(event.eventType)}: ${event.description}`;
      break;
    default:
      content = 'Unknown event';
  }

  return (
    <div className="print-event flex">
      <span className="w-24 flex-shrink-0 text-gray-600">{timestamp}</span>
      <span className={isFever ? 'print-fever' : ''}>{content}</span>
      {event.notes && (
        <span className="text-gray-500 ml-2">- {event.notes}</span>
      )}
    </div>
  );
}
