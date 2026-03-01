'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SymptomEntry, SymptomType, SymptomSeverity } from '@/domain/entities/symptom-entry';
import { LogSymptom, GetSymptomEntries } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useSymptoms() {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new GetSymptomEntries(eventRepository);
      const result = await useCase.execute();
      setEntries(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load symptoms'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logSymptom = useCallback(
    async (symptom: SymptomType, severity?: SymptomSeverity, notes?: string) => {
      try {
        const useCase = new LogSymptom(eventRepository);
        const result = await useCase.execute({ symptom, severity, notes });
        // Refresh the list
        await refreshEntries();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to log symptom'));
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
    logSymptom,
    refreshEntries,
  };
}
