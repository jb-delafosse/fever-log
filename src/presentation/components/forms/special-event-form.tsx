'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SpecialEventType } from '@/domain/entities/special-event';
import { SPECIAL_EVENT_TYPE_LABELS } from '@/domain/entities/special-event';

interface SpecialEventFormProps {
  onSubmit: (
    eventType: SpecialEventType,
    description: string,
    notes?: string
  ) => Promise<void>;
  isLoading?: boolean;
}

const EVENT_TYPES: SpecialEventType[] = ['surgery', 'hospitalization', 'other'];

export function SpecialEventForm({ onSubmit, isLoading }: SpecialEventFormProps) {
  const [eventType, setEventType] = useState<SpecialEventType | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventType || !description.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(
        eventType,
        description.trim(),
        notes.trim() || undefined
      );
      setEventType(null);
      setDescription('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = eventType && description.trim();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Log Special Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(eventType === type ? null : type)}
                  disabled={isLoading || submitting}
                  className={`p-3 text-sm font-medium rounded-md border transition-colors ${
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Describe the event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading || submitting}
              rows={4}
              className="resize-none"
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
            {submitting ? 'Logging...' : 'Log Special Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
