'use client';

import { useState, useCallback } from 'react';
import { EditEvent } from '@/application';
import type { FeverEvent } from '@/application/ports/event-repository';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useEditEvent() {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const editEvent = useCallback(
    async (
      id: string,
      updates: Partial<Omit<FeverEvent, 'id' | 'type' | 'createdAt'>>
    ): Promise<FeverEvent> => {
      try {
        setIsEditing(true);
        setError(null);
        const useCase = new EditEvent(eventRepository);
        const result = await useCase.execute({ id, updates });
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to edit event'));
        throw err;
      } finally {
        setIsEditing(false);
      }
    },
    []
  );

  return {
    editEvent,
    isEditing,
    error,
  };
}
