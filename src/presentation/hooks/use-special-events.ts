'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SpecialEvent, SpecialEventType } from '@/domain/entities/special-event';
import { LogSpecialEvent, GetSpecialEvents } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useSpecialEvents() {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new GetSpecialEvents(eventRepository);
      const result = await useCase.execute();
      setEvents(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load special events'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logSpecialEvent = useCallback(
    async (
      eventType: SpecialEventType,
      description: string,
      notes?: string
    ) => {
      try {
        const useCase = new LogSpecialEvent(eventRepository);
        const result = await useCase.execute({ eventType, description, notes });
        // Refresh the list
        await refreshEvents();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to log special event'));
        throw err;
      }
    },
    [refreshEvents]
  );

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  return {
    events,
    isLoading,
    error,
    logSpecialEvent,
    refreshEvents,
  };
}
