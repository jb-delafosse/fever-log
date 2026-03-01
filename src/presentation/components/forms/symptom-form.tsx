'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SymptomType, SymptomSeverity } from '@/domain/entities/symptom-entry';
import { SYMPTOM_LABELS, SEVERITY_LABELS } from '@/domain/entities/symptom-entry';

interface SymptomFormProps {
  onSubmit: (
    symptom: SymptomType,
    severity?: SymptomSeverity,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

const PREDEFINED_SYMPTOMS: SymptomType[] = [
  'sore_throat',
  'fatigue',
  'stomach_ache',
  'coughing',
  'nasal_congestion',
  'ear_infection',
];

const SEVERITY_OPTIONS: SymptomSeverity[] = [1, 2, 3];

export function SymptomForm({ onSubmit, isLoading }: SymptomFormProps) {
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(null);
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState<SymptomSeverity | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const symptom = selectedSymptom || customSymptom.trim();
    if (!symptom) return;

    setSubmitting(true);
    try {
      await onSubmit(symptom, severity, notes || undefined);
      setSelectedSymptom(null);
      setCustomSymptom('');
      setSeverity(undefined);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSymptomSelect = (symptom: SymptomType) => {
    if (selectedSymptom === symptom) {
      setSelectedSymptom(null);
    } else {
      setSelectedSymptom(symptom);
      setCustomSymptom('');
    }
  };

  const handleCustomSymptomChange = (value: string) => {
    setCustomSymptom(value);
    if (value.trim()) {
      setSelectedSymptom(null);
    }
  };

  const hasSymptom = selectedSymptom || customSymptom.trim();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Log Symptom</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Symptom Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Symptom</label>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_SYMPTOMS.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomSelect(symptom)}
                  disabled={isLoading || submitting}
                  className={`p-3 text-sm font-medium rounded-md border transition-colors ${
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

          {/* Custom Symptom Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Or enter custom symptom</label>
            <Input
              type="text"
              placeholder="Other symptom..."
              value={customSymptom}
              onChange={(e) => handleCustomSymptomChange(e.target.value)}
              disabled={isLoading || submitting}
            />
          </div>

          {/* Severity Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Severity (optional)</label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(severity === level ? undefined : level)}
                  disabled={isLoading || submitting}
                  className={`flex-1 p-3 text-sm font-medium rounded-md border transition-colors ${
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

          {/* Notes */}
          <Input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading || submitting}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!hasSymptom || isLoading || submitting}
          >
            {submitting ? 'Logging...' : 'Log Symptom'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
