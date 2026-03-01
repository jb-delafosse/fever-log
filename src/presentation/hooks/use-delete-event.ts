'use client';

import { useState, useCallback } from 'react';
import { DeleteEvent } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useDeleteEvent() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      const useCase = new DeleteEvent(eventRepository);
      await useCase.execute({ id });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete event'));
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    deleteEvent,
    isDeleting,
    error,
  };
}
