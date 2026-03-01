'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { TemperatureForm } from '@/presentation/components/forms/temperature-form';
import { SymptomForm } from '@/presentation/components/forms/symptom-form';
import { TreatmentForm } from '@/presentation/components/forms/treatment-form';
import { DoctorVisitForm } from '@/presentation/components/forms/doctor-visit-form';
import { SpecialEventForm } from '@/presentation/components/forms/special-event-form';
import { Timeline } from '@/presentation/components/views/timeline';
import { EpisodeList } from '@/presentation/components/views/episode-list';
import { useTemperatures } from '@/presentation/hooks/use-temperatures';
import { useSymptoms } from '@/presentation/hooks/use-symptoms';
import { useTreatments } from '@/presentation/hooks/use-treatments';
import { useDoctorVisits } from '@/presentation/hooks/use-doctor-visits';
import { useSpecialEvents } from '@/presentation/hooks/use-special-events';
import { useEpisodes } from '@/presentation/hooks/use-episodes';
import { useDeleteEvent } from '@/presentation/hooks/use-delete-event';
import { useEditEvent } from '@/presentation/hooks/use-edit-event';
import { EditEventDialog } from '@/presentation/components/forms/edit-event-dialog';
import type { FeverEvent } from '@/application/ports/event-repository';
import type { TreatmentEffectiveness } from '@/domain/entities/treatment-entry';
import type { SpecialEventType } from '@/domain/entities/special-event';
import { ProtectedRoute } from '@/presentation/components/auth/protected-route';
import { SyncStatusIndicator } from '@/presentation/components/sync/sync-status-indicator';

type ViewType = 'log' | 'episodes';
type LogTabType = 'temperature' | 'symptom' | 'treatment' | 'doctor' | 'special';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('log');
  const [activeLogTab, setActiveLogTab] = useState<LogTabType>('temperature');
  const [editingEvent, setEditingEvent] = useState<FeverEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { readings, isLoading: tempLoading, logTemperature, refreshReadings } = useTemperatures();
  const { entries: symptomEntries, isLoading: symptomLoading, logSymptom, refreshEntries: refreshSymptoms } = useSymptoms();
  const { entries: treatmentEntries, isLoading: treatmentLoading, logTreatment, refreshEntries: refreshTreatments } = useTreatments();
  const { visits: doctorVisits, isLoading: doctorLoading, logDoctorVisit, refreshVisits } = useDoctorVisits();
  const { events: specialEvents, isLoading: specialLoading, logSpecialEvent, refreshEvents: refreshSpecialEvents } = useSpecialEvents();
  const { episodes, activeEpisode, isLoading: episodesLoading, refreshEpisodes } = useEpisodes();
  const { deleteEvent } = useDeleteEvent();
  const { editEvent } = useEditEvent();

  const isLoading = tempLoading || symptomLoading || treatmentLoading || doctorLoading || specialLoading;

  // Merge and sort all events by timestamp (most recent first)
  const allEvents: FeverEvent[] = useMemo(() => {
    const combined = [...readings, ...symptomEntries, ...treatmentEntries, ...doctorVisits, ...specialEvents];
    return combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [readings, symptomEntries, treatmentEntries, doctorVisits, specialEvents]);

  // Refresh episodes when events change
  useEffect(() => {
    if (!isLoading) {
      refreshEpisodes();
    }
  }, [readings, symptomEntries, treatmentEntries, doctorVisits, specialEvents, isLoading, refreshEpisodes]);

  const handleTemperatureSubmit = async (value: number, unit: 'C' | 'F', notes?: string) => {
    await logTemperature(value, unit, notes);
  };

  const handleSymptomSubmit = async (
    symptom: string,
    severity?: 1 | 2 | 3,
    notes?: string
  ) => {
    await logSymptom(symptom, severity, notes);
  };

  const handleTreatmentSubmit = async (
    treatment: string,
    dosage?: string,
    effectiveness?: TreatmentEffectiveness,
    notes?: string
  ) => {
    await logTreatment(treatment, dosage, effectiveness, notes);
  };

  const handleDoctorVisitSubmit = async (
    reason: string,
    outcome: string,
    doctorName?: string,
    notes?: string
  ) => {
    await logDoctorVisit(reason, outcome, doctorName, notes);
  };

  const handleSpecialEventSubmit = async (
    eventType: SpecialEventType,
    description: string,
    notes?: string
  ) => {
    await logSpecialEvent(eventType, description, notes);
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    // Refresh all data sources after deletion
    await Promise.all([
      refreshReadings(),
      refreshSymptoms(),
      refreshTreatments(),
      refreshVisits(),
      refreshSpecialEvents(),
    ]);
  };

  const handleEdit = (event: FeverEvent) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: Partial<FeverEvent>) => {
    await editEvent(id, updates);
    // Refresh all data sources after editing
    await Promise.all([
      refreshReadings(),
      refreshSymptoms(),
      refreshTreatments(),
      refreshVisits(),
      refreshSpecialEvents(),
    ]);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fever Log</h1>
              <p className="text-sm text-muted-foreground">
                Track fever episodes, symptoms, and treatments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SyncStatusIndicator />
              <Link
                href="/reports"
                className="text-sm font-medium text-primary hover:underline"
              >
                Reports
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-primary hover:underline"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-md">
        {/* Main View Toggle */}
        <div className="flex rounded-lg border p-1 bg-muted/50">
          <button
            onClick={() => setActiveView('log')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeView === 'log'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Log Event
          </button>
          <button
            onClick={() => setActiveView('episodes')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors relative ${
              activeView === 'episodes'
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            Episodes
            {activeEpisode && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {activeView === 'log' && (
          <>
            {/* Log Tab Navigation */}
            <div className="flex rounded-lg border p-1 bg-muted/50">
              <button
                onClick={() => setActiveLogTab('temperature')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeLogTab === 'temperature'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Temp
              </button>
              <button
                onClick={() => setActiveLogTab('symptom')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeLogTab === 'symptom'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Symptom
              </button>
              <button
                onClick={() => setActiveLogTab('treatment')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeLogTab === 'treatment'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Treatment
              </button>
              <button
                onClick={() => setActiveLogTab('doctor')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeLogTab === 'doctor'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Doctor
              </button>
              <button
                onClick={() => setActiveLogTab('special')}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeLogTab === 'special'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Special
              </button>
            </div>

            {/* Form based on active tab */}
            {activeLogTab === 'temperature' && (
              <TemperatureForm onSubmit={handleTemperatureSubmit} isLoading={isLoading} />
            )}
            {activeLogTab === 'symptom' && (
              <SymptomForm onSubmit={handleSymptomSubmit} isLoading={isLoading} />
            )}
            {activeLogTab === 'treatment' && (
              <TreatmentForm onSubmit={handleTreatmentSubmit} isLoading={isLoading} />
            )}
            {activeLogTab === 'doctor' && (
              <DoctorVisitForm onSubmit={handleDoctorVisitSubmit} isLoading={isLoading} />
            )}
            {activeLogTab === 'special' && (
              <SpecialEventForm onSubmit={handleSpecialEventSubmit} isLoading={isLoading} />
            )}

            {/* Combined Timeline */}
            <Timeline events={allEvents} isLoading={isLoading} onDelete={handleDelete} onEdit={handleEdit} />
          </>
        )}

        {activeView === 'episodes' && (
          <EpisodeList
            episodes={episodes}
            activeEpisode={activeEpisode}
            isLoading={episodesLoading}
          />
        )}
      </main>

        {/* Edit Event Dialog */}
        <EditEventDialog
          event={editingEvent}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveEdit}
        />
      </div>
    </ProtectedRoute>
  );
}
