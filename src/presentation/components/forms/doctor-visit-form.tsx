'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DoctorVisitFormProps {
  onSubmit: (
    reason: string,
    outcome: string,
    doctorName?: string,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export function DoctorVisitForm({ onSubmit, isLoading }: DoctorVisitFormProps) {
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim() || !outcome.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(
        reason.trim(),
        outcome.trim(),
        doctorName.trim() || undefined,
        notes.trim() || undefined
      );
      setReason('');
      setOutcome('');
      setDoctorName('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = reason.trim() && outcome.trim();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Log Doctor Visit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Why did you visit the doctor?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading || submitting}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Outcome / Diagnosis <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="What was the diagnosis or outcome?"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              disabled={isLoading || submitting}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Doctor Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Doctor Name (optional)</label>
            <Input
              type="text"
              placeholder="Dr. Smith"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              disabled={isLoading || submitting}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes (optional)</label>
            <Input
              type="text"
              placeholder="Any other information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading || submitting}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!isValid || isLoading || submitting}
          >
            {submitting ? 'Logging...' : 'Log Doctor Visit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
