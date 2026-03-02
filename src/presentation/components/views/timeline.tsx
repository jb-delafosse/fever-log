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
import {
  Thermometer,
  HeartPulse,
  Pill,
  Stethoscope,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground tracking-tight">Recent Events</h2>
        <span className="text-xs text-muted-foreground">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>
      <div className="space-y-3">
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
    <div className="flex items-center gap-0.5">
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onEdit(event)}
        >
          <span className="sr-only">Edit</span>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}
      {onDelete && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => setDeleteOpen(true)}
          >
            <span className="sr-only">Delete</span>
            <Trash2 className="w-3.5 h-3.5" />
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
    <Card className={cn(
      "group transition-all duration-200",
      isFever && "border-l-2 border-l-fever-high"
    )}>
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 shrink-0 transition-colors",
          isFever ? "text-fever-high" : "text-temperature-accent"
        )}>
          <Thermometer className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-semibold tabular-nums tracking-tight",
              isFever ? "text-fever-high" : "text-foreground"
            )}>
              {displayValue}
            </span>
            <span className="text-sm text-muted-foreground">°{displayUnit}</span>
            {isFever && (
              <span className="text-xs font-medium text-fever-high uppercase tracking-wide">
                Fever
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(reading.timestamp)}
          </p>
          {reading.notes && (
            <p className="text-sm text-foreground/80 mt-1 truncate">
              {reading.notes}
            </p>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
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
  const severityStyles: Record<number, { badge: string; text: string }> = {
    1: { badge: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
    2: { badge: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300' },
    3: { badge: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' },
  };

  return (
    <Card className="group transition-all duration-200">
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 text-symptom-accent shrink-0">
          <HeartPulse className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-medium text-foreground">
              {getSymptomLabel(entry.symptom)}
            </span>
            {entry.severity && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                severityStyles[entry.severity].badge,
                severityStyles[entry.severity].text
              )}>
                {getSeverityLabel(entry.severity)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(entry.timestamp)}
          </p>
          {entry.notes && (
            <p className="text-sm text-foreground/80 mt-1 truncate">
              {entry.notes}
            </p>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
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
  const effectivenessStyles: Record<number, string> = {
    1: 'text-red-600 dark:text-red-400',
    2: 'text-orange-600 dark:text-orange-400',
    3: 'text-amber-600 dark:text-amber-400',
    4: 'text-lime-600 dark:text-lime-400',
    5: 'text-emerald-600 dark:text-emerald-400',
  };

  return (
    <Card className="group transition-all duration-200">
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 text-treatment-accent shrink-0">
          <Pill className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-medium text-foreground">
              {getTreatmentLabel(entry.treatment)}
            </span>
            {entry.dosage && (
              <span className="text-sm text-muted-foreground">
                {entry.dosage}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(entry.timestamp)}
          </p>
          {entry.effectiveness && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-muted-foreground">Effectiveness:</span>
              <span className={cn("text-xs font-medium", effectivenessStyles[entry.effectiveness])}>
                {getEffectivenessLabel(entry.effectiveness)}
              </span>
            </div>
          )}
          {entry.notes && (
            <p className="text-sm text-foreground/80 mt-1 truncate">
              {entry.notes}
            </p>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
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
    <Card className="group transition-all duration-200">
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 text-doctor-accent shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-foreground">
                Doctor Visit
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ActionButtons event={visit} onDelete={onDelete} onEdit={onEdit} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(visit.timestamp)}
              {visit.doctorName && ` · Dr. ${visit.doctorName}`}
            </p>

            <div className="mt-3 space-y-2">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Reason
                </span>
                <p className="text-sm text-foreground/90 mt-0.5">{visit.reason}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Outcome
                </span>
                <p className="text-sm text-foreground/90 mt-0.5">{visit.outcome}</p>
              </div>
              {visit.notes && (
                <p className="text-sm text-muted-foreground italic mt-2">
                  {visit.notes}
                </p>
              )}
            </div>
          </div>
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
    <Card className="group transition-all duration-200 border-l-2 border-l-special-accent">
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 text-special-accent shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-foreground">
                {getSpecialEventTypeLabel(event.eventType)}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ActionButtons event={event} onDelete={onDelete} onEdit={onEdit} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(event.timestamp)}
            </p>
            <p className="text-sm text-foreground/90 mt-2">{event.description}</p>
            {event.notes && (
              <p className="text-sm text-muted-foreground italic mt-2">
                {event.notes}
              </p>
            )}
          </div>
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
