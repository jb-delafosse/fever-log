'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TreatmentEntry, TreatmentEffectiveness } from '@/domain/entities/treatment-entry';
import { LogTreatment, GetTreatmentEntries } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useTreatments() {
  const [entries, setEntries] = useState<TreatmentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new GetTreatmentEntries(eventRepository);
      const result = await useCase.execute();
      setEntries(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load treatments'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logTreatment = useCallback(
    async (
      treatment: string,
      dosage?: string,
      effectiveness?: TreatmentEffectiveness,
      notes?: string
    ) => {
      try {
        const useCase = new LogTreatment(eventRepository);
        const result = await useCase.execute({ treatment, dosage, effectiveness, notes });
        // Refresh the list
        await refreshEntries();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to log treatment'));
        throw err;
      }
    },
    [refreshEntries]
  );

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  return {
    entries,
    isLoading,
    error,
    logTreatment,
    refreshEntries,
  };
}
