'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FeverEvent } from '@/application/ports/event-repository';
import type { TemperatureReading } from '@/domain/entities/temperature-reading';
import type { SymptomEntry, SymptomType, SymptomSeverity } from '@/domain/entities/symptom-entry';
import type { TreatmentEntry, TreatmentEffectiveness } from '@/domain/entities/treatment-entry';
import type { DoctorVisit } from '@/domain/entities/doctor-visit';
import type { SpecialEvent, SpecialEventType } from '@/domain/entities/special-event';
import { SYMPTOM_LABELS, SEVERITY_LABELS } from '@/domain/entities/symptom-entry';
import { TREATMENT_LABELS, EFFECTIVENESS_LABELS } from '@/domain/entities/treatment-entry';
import { SPECIAL_EVENT_TYPE_LABELS } from '@/domain/entities/special-event';
import { Temperature } from '@/domain/value-objects/temperature';

interface EditEventDialogProps {
  event: FeverEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<FeverEvent>) => Promise<void>;
}

export function EditEventDialog({
  event,
  open,
  onOpenChange,
  onSave,
}: EditEventDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!event) return null;

  const handleSave = async (updates: Partial<FeverEvent>) => {
    setIsSaving(true);
    try {
      await onSave(event.id, updates);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {getEventTypeLabel(event.type)}
          </DialogTitle>
        </DialogHeader>
        {event.type === 'temperature' && (
          <EditTemperatureForm
            key={event.id}
            event={event as TemperatureReading}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
        {event.type === 'symptom' && (
          <EditSymptomForm
            key={event.id}
            event={event as SymptomEntry}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
        {event.type === 'treatment' && (
          <EditTreatmentForm
            key={event.id}
            event={event as TreatmentEntry}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
        {event.type === 'doctor_visit' && (
          <EditDoctorVisitForm
            key={event.id}
            event={event as DoctorVisit}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
        {event.type === 'special_event' && (
          <EditSpecialEventForm
            key={event.id}
            event={event as SpecialEvent}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function getEventTypeLabel(type: string): string {
  switch (type) {
    case 'temperature':
      return 'Temperature';
    case 'symptom':
      return 'Symptom';
    case 'treatment':
      return 'Treatment';
    case 'doctor_visit':
      return 'Doctor Visit';
    case 'special_event':
      return 'Special Event';
    default:
      return 'Event';
  }
}

// Temperature Edit Form
interface EditTemperatureFormProps {
  event: TemperatureReading;
  onSave: (updates: Partial<TemperatureReading>) => Promise<void>;
  isSaving: boolean;
}

function EditTemperatureForm({ event, onSave, isSaving }: EditTemperatureFormProps) {
  const [value, setValue] = useState(event.valueCelsius.toFixed(1));
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [notes, setNotes] = useState(event.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const temp = new Temperature(numValue, unit);
    await onSave({
      valueCelsius: temp.toCelsius(),
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="number"
          step="0.1"
          placeholder={unit === 'C' ? '38.0' : '100.4'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 text-xl h-12 text-center"
          disabled={isSaving}
          inputMode="decimal"
        />
        <div className="flex rounded-md border">
          <button
            type="button"
            onClick={() => {
              if (unit === 'F') {
                const temp = new Temperature(parseFloat(value) || 0, 'F');
                setValue(temp.toCelsius().toFixed(1));
              }
              setUnit('C');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
              unit === 'C'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            °C
          </button>
          <button
            type="button"
            onClick={() => {
              if (unit === 'C') {
                const temp = new Temperature(parseFloat(value) || 0, 'C');
                setValue(temp.toFahrenheit().toFixed(1));
              }
              setUnit('F');
            }}
            className={`px-3 py-2 text-sm font-medium rounded-r-md transition-colors ${
              unit === 'F'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            °F
          </button>
        </div>
      </div>
      <Input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isSaving}
      />
      <DialogFooter>
        <Button type="submit" disabled={!value || isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Symptom Edit Form
const PREDEFINED_SYMPTOMS: SymptomType[] = [
  'sore_throat',
  'fatigue',
  'stomach_ache',
  'coughing',
  'nasal_congestion',
  'ear_infection',
];

interface EditSymptomFormProps {
  event: SymptomEntry;
  onSave: (updates: Partial<SymptomEntry>) => Promise<void>;
  isSaving: boolean;
}

function EditSymptomForm({ event, onSave, isSaving }: EditSymptomFormProps) {
  const isPredefined = PREDEFINED_SYMPTOMS.includes(event.symptom as SymptomType);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(
    isPredefined ? (event.symptom as SymptomType) : null
  );
  const [customSymptom, setCustomSymptom] = useState(isPredefined ? '' : event.symptom);
  const [severity, setSeverity] = useState<SymptomSeverity | undefined>(event.severity);
  const [notes, setNotes] = useState(event.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const symptom = selectedSymptom || customSymptom.trim();
    if (!symptom) return;

    await onSave({
      symptom,
      severity,
      notes: notes || undefined,
    });
  };

  const handleSymptomSelect = (symptom: SymptomType) => {
    if (selectedSymptom === symptom) {
      setSelectedSymptom(null);
    } else {
      setSelectedSymptom(symptom);
      setCustomSymptom('');
    }
  };

  const hasSymptom = selectedSymptom || customSymptom.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Symptom</label>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINED_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              onClick={() => handleSymptomSelect(symptom)}
              disabled={isSaving}
              className={`p-2 text-sm font-medium rounded-md border transition-colors ${
                selectedSymptom === symptom
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {SYMPTOM_LABELS[symptom]}
            </button>
          ))}
        </div>
      </div>
      <Input
        type="text"
        placeholder="Or enter custom symptom..."
        value={customSymptom}
        onChange={(e) => {
          setCustomSymptom(e.target.value);
          if (e.target.value.trim()) setSelectedSymptom(null);
        }}
        disabled={isSaving}
      />
      <div className="space-y-2">
        <label className="text-sm font-medium">Severity (optional)</label>
        <div className="flex gap-2">
          {([1, 2, 3] as SymptomSeverity[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverity(severity === level ? undefined : level)}
              disabled={isSaving}
              className={`flex-1 p-2 text-sm font-medium rounded-md border transition-colors ${
                severity === level
                  ? level === 1
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                    : level === 2
                    ? 'bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                    : 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {SEVERITY_LABELS[level]}
            </button>
          ))}
        </div>
      </div>
      <Input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isSaving}
      />
      <DialogFooter>
        <Button type="submit" disabled={!hasSymptom || isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Treatment Edit Form
const PREDEFINED_TREATMENTS = ['doliprane', 'antibiotics'];

interface EditTreatmentFormProps {
  event: TreatmentEntry;
  onSave: (updates: Partial<TreatmentEntry>) => Promise<void>;
  isSaving: boolean;
}

function EditTreatmentForm({ event, onSave, isSaving }: EditTreatmentFormProps) {
  const isPredefined = PREDEFINED_TREATMENTS.includes(event.treatment);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(
    isPredefined ? event.treatment : null
  );
  const [customTreatment, setCustomTreatment] = useState(isPredefined ? '' : event.treatment);
  const [dosage, setDosage] = useState(event.dosage || '');
  const [effectiveness, setEffectiveness] = useState<TreatmentEffectiveness | undefined>(
    event.effectiveness
  );
  const [notes, setNotes] = useState(event.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const treatment = selectedTreatment || customTreatment.trim();
    if (!treatment) return;

    await onSave({
      treatment,
      dosage: dosage || undefined,
      effectiveness,
      notes: notes || undefined,
    });
  };

  const hasTreatment = selectedTreatment || customTreatment.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Treatment</label>
        <div className="flex gap-2">
          {PREDEFINED_TREATMENTS.map((treatment) => (
            <button
              key={treatment}
              type="button"
              onClick={() => {
                if (selectedTreatment === treatment) {
                  setSelectedTreatment(null);
                } else {
                  setSelectedTreatment(treatment);
                  setCustomTreatment('');
                }
              }}
              disabled={isSaving}
              className={`flex-1 p-2 text-sm font-medium rounded-md border transition-colors ${
                selectedTreatment === treatment
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {TREATMENT_LABELS[treatment] || treatment}
            </button>
          ))}
        </div>
      </div>
      <Input
        type="text"
        placeholder="Or enter custom treatment..."
        value={customTreatment}
        onChange={(e) => {
          setCustomTreatment(e.target.value);
          if (e.target.value.trim()) setSelectedTreatment(null);
        }}
        disabled={isSaving}
      />
      <Input
        type="text"
        placeholder="Dosage (e.g., 500mg)"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        disabled={isSaving}
      />
      <div className="space-y-2">
        <label className="text-sm font-medium">Effectiveness (optional)</label>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as TreatmentEffectiveness[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEffectiveness(effectiveness === level ? undefined : level)}
              disabled={isSaving}
              className={`flex-1 p-2 text-xs font-medium rounded-md border transition-colors ${
                effectiveness === level
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {EFFECTIVENESS_LABELS[level]}
            </button>
          ))}
        </div>
      </div>
      <Input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isSaving}
      />
      <DialogFooter>
        <Button type="submit" disabled={!hasTreatment || isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Doctor Visit Edit Form
interface EditDoctorVisitFormProps {
  event: DoctorVisit;
  onSave: (updates: Partial<DoctorVisit>) => Promise<void>;
  isSaving: boolean;
}

function EditDoctorVisitForm({ event, onSave, isSaving }: EditDoctorVisitFormProps) {
  const [reason, setReason] = useState(event.reason);
  const [outcome, setOutcome] = useState(event.outcome);
  const [doctorName, setDoctorName] = useState(event.doctorName || '');
  const [notes, setNotes] = useState(event.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !outcome.trim()) return;

    await onSave({
      reason: reason.trim(),
      outcome: outcome.trim(),
      doctorName: doctorName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Reason for Visit</label>
        <Textarea
          placeholder="Why did you visit the doctor?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSaving}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Outcome</label>
        <Textarea
          placeholder="What was the result?"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          disabled={isSaving}
          rows={2}
        />
      </div>
      <Input
        type="text"
        placeholder="Doctor's name (optional)"
        value={doctorName}
        onChange={(e) => setDoctorName(e.target.value)}
        disabled={isSaving}
      />
      <Input
        type="text"
        placeholder="Additional notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isSaving}
      />
      <DialogFooter>
        <Button type="submit" disabled={!reason.trim() || !outcome.trim() || isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Special Event Edit Form
interface EditSpecialEventFormProps {
  event: SpecialEvent;
  onSave: (updates: Partial<SpecialEvent>) => Promise<void>;
  isSaving: boolean;
}

function EditSpecialEventForm({ event, onSave, isSaving }: EditSpecialEventFormProps) {
  const [eventType, setEventType] = useState<SpecialEventType>(event.eventType);
  const [description, setDescription] = useState(event.description);
  const [notes, setNotes] = useState(event.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    await onSave({
      eventType,
      description: description.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Event Type</label>
        <div className="flex gap-2">
          {(['surgery', 'hospitalization', 'other'] as SpecialEventType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setEventType(type)}
              disabled={isSaving}
              className={`flex-1 p-2 text-sm font-medium rounded-md border transition-colors ${
                eventType === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted border-border'
              }`}
            >
              {SPECIAL_EVENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="Describe the event..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
          rows={3}
        />
      </div>
      <Input
        type="text"
        placeholder="Additional notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isSaving}
      />
      <DialogFooter>
        <Button type="submit" disabled={!description.trim() || isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}
