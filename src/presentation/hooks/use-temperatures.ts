'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TemperatureReading } from '@/domain/entities/temperature-reading';
import { LogTemperature, GetTemperatureReadings } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useTemperatures() {
  const [readings, setReadings] = useState<TemperatureReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshReadings = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new GetTemperatureReadings(eventRepository);
      const result = await useCase.execute();
      setReadings(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load temperatures'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logTemperature = useCallback(
    async (value: number, unit: 'C' | 'F', notes?: string) => {
      try {
        const useCase = new LogTemperature(eventRepository);
        const result = await useCase.execute({ value, unit, notes });
        // Refresh the list
        await refreshReadings();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to log temperature'));
        throw err;
      }
    },
    [refreshReadings]
  );

  useEffect(() => {
    refreshReadings();
  }, [refreshReadings]);

  return {
    readings,
    isLoading,
    error,
    logTemperature,
    refreshReadings,
  };
}
