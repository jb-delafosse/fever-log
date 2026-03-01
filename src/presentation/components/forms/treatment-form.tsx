'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TreatmentEffectiveness } from '@/domain/entities/treatment-entry';
import { PREDEFINED_TREATMENTS, EFFECTIVENESS_LABELS } from '@/domain/entities/treatment-entry';

interface TreatmentFormProps {
  onSubmit: (
    treatment: string,
    dosage?: string,
    effectiveness?: TreatmentEffectiveness,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

const EFFECTIVENESS_OPTIONS: TreatmentEffectiveness[] = [1, 2, 3, 4, 5];

export function TreatmentForm({ onSubmit, isLoading }: TreatmentFormProps) {
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [customTreatment, setCustomTreatment] = useState('');
  const [dosage, setDosage] = useState('');
  const [effectiveness, setEffectiveness] = useState<TreatmentEffectiveness | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const treatment = selectedTreatment || customTreatment.trim();
    if (!treatment) return;

    setSubmitting(true);
    try {
      await onSubmit(treatment, dosage || undefined, effectiveness, notes || undefined);
      setSelectedTreatment(null);
      setCustomTreatment('');
      setDosage('');
      setEffectiveness(undefined);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTreatmentSelect = (treatmentId: string, defaultDosage: string) => {
    if (selectedTreatment === treatmentId) {
      setSelectedTreatment(null);
      setDosage('');
    } else {
      setSelectedTreatment(treatmentId);
      setCustomTreatment('');
      if (defaultDosage) {
        setDosage(defaultDosage);
      }
    }
  };

  const handleCustomTreatmentChange = (value: string) => {
    setCustomTreatment(value);
    if (value.trim()) {
      setSelectedTreatment(null);
    }
  };

  const hasTreatment = selectedTreatment || customTreatment.trim();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Log Treatment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Treatment Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Treatment</label>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_TREATMENTS.map((treatment) => (
                <button
                  key={treatment.id}
                  type="button"
                  onClick={() => handleTreatmentSelect(treatment.id, treatment.defaultDosage)}
                  disabled={isLoading || submitting}
                  className={`p-3 text-sm font-medium rounded-md border transition-colors ${
                    selectedTreatment === treatment.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  {treatment.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Treatment Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Or enter custom treatment</label>
            <Input
              type="text"
              placeholder="Other treatment..."
              value={customTreatment}
              onChange={(e) => handleCustomTreatmentChange(e.target.value)}
              disabled={isLoading || submitting}
            />
          </div>

          {/* Dosage Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Dosage (optional)</label>
            <Input
              type="text"
              placeholder="e.g., 500mg, 5ml"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              disabled={isLoading || submitting}
            />
          </div>

          {/* Effectiveness Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Effectiveness (optional)</label>
            <div className="flex gap-1">
              {EFFECTIVENESS_OPTIONS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEffectiveness(effectiveness === level ? undefined : level)}
                  disabled={isLoading || submitting}
                  title={EFFECTIVENESS_LABELS[level]}
                  className={`flex-1 p-3 text-lg font-medium rounded-md border transition-colors ${
                    effectiveness === level
                      ? level <= 2
                        ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        : level === 3
                        ? 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        : 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'hover:bg-muted border-border'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            {effectiveness && (
              <p className="text-xs text-muted-foreground text-center">
                {EFFECTIVENESS_LABELS[effectiveness]}
              </p>
            )}
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
            disabled={!hasTreatment || isLoading || submitting}
          >
            {submitting ? 'Logging...' : 'Log Treatment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
