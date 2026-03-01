'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Episode } from '@/domain/entities/episode';
import { ComputeEpisodes } from '@/application';
import { eventRepository } from '@/infrastructure/persistence/local/dexie-event-repository';

export function useEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshEpisodes = useCallback(async () => {
    try {
      setIsLoading(true);
      const useCase = new ComputeEpisodes(eventRepository);
      const result = await useCase.execute();
      setEpisodes(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to compute episodes'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEpisodes();
  }, [refreshEpisodes]);

  // Get the currently active episode (if any)
  const activeEpisode = episodes.find((ep) => ep.isActive) || null;

  // Get past episodes (not active)
  const pastEpisodes = episodes.filter((ep) => !ep.isActive);

  return {
    episodes,
    activeEpisode,
    pastEpisodes,
    isLoading,
    error,
    refreshEpisodes,
  };
}
