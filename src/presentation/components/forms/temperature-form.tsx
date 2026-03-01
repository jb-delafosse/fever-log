'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TemperatureFormProps {
  onSubmit: (value: number, unit: 'C' | 'F', notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export function TemperatureForm({ onSubmit, isLoading }: TemperatureFormProps) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setSubmitting(true);
    try {
      await onSubmit(numValue, unit, notes || undefined);
      setValue('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Log Temperature</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              placeholder={unit === 'C' ? '38.0' : '100.4'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 text-2xl h-14 text-center"
              disabled={isLoading || submitting}
              inputMode="decimal"
            />
            <div className="flex rounded-md border">
              <button
                type="button"
                onClick={() => setUnit('C')}
                className={`px-4 py-2 text-lg font-medium rounded-l-md transition-colors ${
                  unit === 'C'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setUnit('F')}
                className={`px-4 py-2 text-lg font-medium rounded-r-md transition-colors ${
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
            disabled={isLoading || submitting}
          />

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={!value || isLoading || submitting}
          >
            {submitting ? 'Logging...' : 'Log Temperature'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
