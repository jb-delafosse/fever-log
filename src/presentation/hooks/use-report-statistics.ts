'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComputeReportStatistics } from '@/application';
import type { ReportStatistics } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useReportStatistics() {
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new ComputeReportStatistics(eventRepository);
      const result = await useCase.execute();
      setStatistics(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load statistics'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refreshStatistics,
  };
}
