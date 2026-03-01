'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Episode } from '@/domain/entities/episode';
import { getSymptomLabel } from '@/domain/entities/symptom-entry';
import { getTreatmentLabel } from '@/domain/entities/treatment-entry';

interface EpisodeListProps {
  episodes: Episode[];
  activeEpisode: Episode | null;
  isLoading?: boolean;
}

export function EpisodeList({ episodes, activeEpisode, isLoading }: EpisodeListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Loading episodes...</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No fever episodes recorded yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Episodes are automatically created when you log a temperature of 38°C or higher.
        </p>
      </div>
    );
  }

  const pastEpisodes = episodes.filter((ep) => !ep.isActive);

  return (
    <div className="space-y-6">
      {/* Active Episode */}
      {activeEpisode && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Active Episode
          </h2>
          <EpisodeCard episode={activeEpisode} isActive />
        </div>
      )}

      {/* Past Episodes */}
      {pastEpisodes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Past Episodes</h2>
          <div className="space-y-3">
            {pastEpisodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  isActive?: boolean;
}

function EpisodeCard({ episode, isActive }: EpisodeCardProps) {
  const formatDateRange = (start: Date, end: Date): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const dateFormatter = new Intl.DateTimeFormat('default', {
      month: 'short',
      day: 'numeric',
    });

    const timeFormatter = new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const startDateStr = dateFormatter.format(startDate);
    const endDateStr = dateFormatter.format(endDate);

    if (startDateStr === endDateStr) {
      // Same day
      return `${startDateStr}, ${timeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`;
    }

    return `${startDateStr} - ${endDateStr}`;
  };

  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      return 'Less than 1 hour';
    }
    if (hours < 24) {
      return `${Math.round(hours)} hour${hours >= 2 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}, ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
  };

  return (
    <Card className={isActive ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>{formatDateRange(episode.startDate, episode.endDate)}</span>
          {isActive && (
            <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-2 py-1 rounded-full">
              Ongoing
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Duration */}
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-semibold">{formatDuration(episode.durationHours)}</p>
          </div>

          {/* Max Temp */}
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Max Temp</p>
            <p className="text-sm font-semibold text-red-600">
              {episode.maxTemperature ? `${episode.maxTemperature.toFixed(1)}°C` : 'N/A'}
            </p>
          </div>

          {/* Event Count */}
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Events</p>
            <p className="text-sm font-semibold">{episode.events.length}</p>
          </div>
        </div>

        {/* Symptoms */}
        {episode.symptoms.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Symptoms</p>
            <div className="flex flex-wrap gap-1">
              {episode.symptoms.map((symptom) => (
                <span
                  key={symptom}
                  className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 px-2 py-0.5 rounded"
                >
                  {getSymptomLabel(symptom)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Treatments */}
        {episode.treatments.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Treatments</p>
            <div className="flex flex-wrap gap-1">
              {episode.treatments.map((treatment) => (
                <span
                  key={treatment}
                  className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200 px-2 py-0.5 rounded"
                >
                  {getTreatmentLabel(treatment)}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
