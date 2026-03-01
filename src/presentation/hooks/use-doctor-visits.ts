'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DoctorVisit } from '@/domain/entities/doctor-visit';
import { LogDoctorVisit, GetDoctorVisits } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useDoctorVisits() {
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshVisits = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new GetDoctorVisits(eventRepository);
      const result = await useCase.execute();
      setVisits(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load doctor visits'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logDoctorVisit = useCallback(
    async (
      reason: string,
      outcome: string,
      doctorName?: string,
      notes?: string
    ) => {
      try {
        const useCase = new LogDoctorVisit(eventRepository);
        const result = await useCase.execute({ reason, outcome, doctorName, notes });
        // Refresh the list
        await refreshVisits();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to log doctor visit'));
        throw err;
      }
    },
    [refreshVisits]
  );

  useEffect(() => {
    refreshVisits();
  }, [refreshVisits]);

  return {
    visits,
    isLoading,
    error,
    logDoctorVisit,
    refreshVisits,
  };
}
