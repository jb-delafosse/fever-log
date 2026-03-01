'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TemperatureReading } from '@/domain/entities/temperature-reading';
import type { SymptomEntry } from '@/domain/entities/symptom-entry';
import type { TreatmentEntry } from '@/domain/entities/treatment-entry';
import type { DoctorVisit } from '@/domain/entities/doctor-visit';
import type { SpecialEvent } from '@/domain/entities/special-event';
import { getSymptomLabel, getSeverityLabel } from '@/domain/entities/symptom-entry';
import { getTreatmentLabel, getEffectivenessLabel } from '@/domain/entities/treatment-entry';
import { getSpecialEventTypeLabel } from '@/domain/entities/special-event';
import { Temperature } from '@/domain/value-objects/temperature';
import type { FeverEvent } from '@/application/ports/event-repository';

interface TimelineProps {
  events: FeverEvent[];
  isLoading?: boolean;
  unit?: 'C' | 'F';
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

export function Timeline({ events, isLoading, unit = 'C', onDelete, onEdit }: TimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No events logged yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Log your first event above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Recent Events</h2>
      <div className="space-y-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} displayUnit={unit} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

interface EventCardProps {
  event: FeverEvent;
  displayUnit: 'C' | 'F';
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function EventCard({ event, displayUnit, onDelete, onEdit }: EventCardProps) {
  if (event.type === 'temperature') {
    return <TemperatureCard reading={event} displayUnit={displayUnit} onDelete={onDelete} onEdit={onEdit} />;
  }
  if (event.type === 'symptom') {
    return <SymptomCard entry={event} onDelete={onDelete} onEdit={onEdit} />;
  }
  if (event.type === 'treatment') {
    return <TreatmentCard entry={event} onDelete={onDelete} onEdit={onEdit} />;
  }
  if (event.type === 'doctor_visit') {
    return <DoctorVisitCard visit={event} onDelete={onDelete} onEdit={onEdit} />;
  }
  if (event.type === 'special_event') {
    return <SpecialEventCard event={event} onDelete={onDelete} onEdit={onEdit} />;
  }
  return null;
}

interface ActionButtonsProps {
  event: FeverEvent;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function ActionButtons({ event, onDelete, onEdit }: ActionButtonsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(event.id);
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          onClick={() => onEdit(event)}
        >
          <span className="sr-only">Edit</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
        </Button>
      )}
      {onDelete && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The event will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

interface TemperatureCardProps {
  reading: TemperatureReading;
  displayUnit: 'C' | 'F';
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function TemperatureCard({ reading, displayUnit, onDelete, onEdit }: TemperatureCardProps) {
  const temp = Temperature.fromCelsius(reading.valueCelsius);
  const isFever = temp.isAbnormal();
  const displayValue = temp.getValue(displayUnit);

  return (
    <Card className={isFever ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-0.5 rounded">
              Temperature
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(reading.timestamp)}
            </p>
          </div>
          {reading.notes && (
            <p className="text-sm mt-1">{reading.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-bold ${isFever ? 'text-red-600' : ''}`}>
              {displayValue}°{displayUnit}
            </p>
            {isFever && (
              <p className="text-xs text-red-600 font-medium">Fever</p>
            )}
          </div>
          <ActionButtons event={reading} onDelete={onDelete} onEdit={onEdit} />
        </div>
      </CardContent>
    </Card>
  );
}

interface SymptomCardProps {
  entry: SymptomEntry;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function SymptomCard({ entry, onDelete, onEdit }: SymptomCardProps) {
  const severityColors = {
    1: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20',
    2: 'border-orange-300 bg-orange-50 dark:bg-orange-950/20',
    3: 'border-red-300 bg-red-50 dark:bg-red-950/20',
  };

  const severityTextColors = {
    1: 'text-yellow-700 dark:text-yellow-300',
    2: 'text-orange-700 dark:text-orange-300',
    3: 'text-red-700 dark:text-red-300',
  };

  const cardClass = entry.severity ? severityColors[entry.severity] : '';

  return (
    <Card className={cardClass}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 px-2 py-0.5 rounded">
              Symptom
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(entry.timestamp)}
            </p>
          </div>
          {entry.notes && (
            <p className="text-sm mt-1">{entry.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold">
              {getSymptomLabel(entry.symptom)}
            </p>
            {entry.severity && (
              <p className={`text-xs font-medium ${severityTextColors[entry.severity]}`}>
                {getSeverityLabel(entry.severity)}
              </p>
            )}
          </div>
          <ActionButtons event={entry} onDelete={onDelete} onEdit={onEdit} />
        </div>
      </CardContent>
    </Card>
  );
}

interface TreatmentCardProps {
  entry: TreatmentEntry;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function TreatmentCard({ entry, onDelete, onEdit }: TreatmentCardProps) {
  const effectivenessColors: Record<number, string> = {
    1: 'border-red-300 bg-red-50 dark:bg-red-950/20',
    2: 'border-orange-300 bg-orange-50 dark:bg-orange-950/20',
    3: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20',
    4: 'border-lime-300 bg-lime-50 dark:bg-lime-950/20',
    5: 'border-green-300 bg-green-50 dark:bg-green-950/20',
  };

  const effectivenessTextColors: Record<number, string> = {
    1: 'text-red-700 dark:text-red-300',
    2: 'text-orange-700 dark:text-orange-300',
    3: 'text-yellow-700 dark:text-yellow-300',
    4: 'text-lime-700 dark:text-lime-300',
    5: 'text-green-700 dark:text-green-300',
  };

  const cardClass = entry.effectiveness ? effectivenessColors[entry.effectiveness] : '';

  return (
    <Card className={cardClass}>
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200 px-2 py-0.5 rounded">
              Treatment
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(entry.timestamp)}
            </p>
          </div>
          {entry.dosage && (
            <p className="text-sm text-muted-foreground mt-1">
              Dosage: {entry.dosage}
            </p>
          )}
          {entry.notes && (
            <p className="text-sm mt-1">{entry.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-semibold">
              {getTreatmentLabel(entry.treatment)}
            </p>
            {entry.effectiveness && (
              <p className={`text-xs font-medium ${effectivenessTextColors[entry.effectiveness]}`}>
                {getEffectivenessLabel(entry.effectiveness)}
              </p>
            )}
          </div>
          <ActionButtons event={entry} onDelete={onDelete} onEdit={onEdit} />
        </div>
      </CardContent>
    </Card>
  );
}

interface DoctorVisitCardProps {
  visit: DoctorVisit;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function DoctorVisitCard({ visit, onDelete, onEdit }: DoctorVisitCardProps) {
  return (
    <Card className="border-indigo-300 bg-indigo-50 dark:bg-indigo-950/20">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 px-2 py-0.5 rounded">
              Doctor Visit
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(visit.timestamp)}
            </p>
          </div>
          <ActionButtons event={visit} onDelete={onDelete} onEdit={onEdit} />
        </div>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Reason:</span> {visit.reason}
          </p>
          <p className="text-sm">
            <span className="font-medium">Outcome:</span> {visit.outcome}
          </p>
          {visit.doctorName && (
            <p className="text-sm text-muted-foreground">
              Dr. {visit.doctorName}
            </p>
          )}
          {visit.notes && (
            <p className="text-sm text-muted-foreground mt-1">{visit.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SpecialEventCardProps {
  event: SpecialEvent;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (event: FeverEvent) => void;
}

function SpecialEventCard({ event, onDelete, onEdit }: SpecialEventCardProps) {
  return (
    <Card className="border-rose-300 bg-rose-50 dark:bg-rose-950/20">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200 px-2 py-0.5 rounded">
              {getSpecialEventTypeLabel(event.eventType)}
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(event.timestamp)}
            </p>
          </div>
          <ActionButtons event={event} onDelete={onDelete} onEdit={onEdit} />
        </div>
        <div className="space-y-1">
          <p className="text-sm">{event.description}</p>
          {event.notes && (
            <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('default', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
