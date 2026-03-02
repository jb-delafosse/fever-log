'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-fever-high rounded-full animate-pulse" />
            Active Episode
          </h2>
          <EpisodeCard episode={activeEpisode} isActive />
        </div>
      )}

      {/* Past Episodes */}
      {pastEpisodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground tracking-tight">Past Episodes</h2>
            <span className="text-xs text-muted-foreground">
              {pastEpisodes.length} {pastEpisodes.length === 1 ? 'episode' : 'episodes'}
            </span>
          </div>
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
    <Card className={cn(
      "transition-all duration-200",
      isActive && "border-l-2 border-l-fever-high"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="text-foreground">{formatDateRange(episode.startDate, episode.endDate)}</span>
          {isActive && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-fever-high">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
              Ongoing
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Duration */}
          <div className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Duration</p>
            <p className="text-sm font-semibold mt-0.5">{formatDuration(episode.durationHours)}</p>
          </div>

          {/* Max Temp */}
          <div className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Max Temp</p>
            <p className="text-sm font-semibold text-fever-high mt-0.5">
              {episode.maxTemperature ? `${episode.maxTemperature.toFixed(1)}°C` : 'N/A'}
            </p>
          </div>

          {/* Event Count */}
          <div className="rounded-lg bg-muted/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Events</p>
            <p className="text-sm font-semibold mt-0.5">{episode.events.length}</p>
          </div>
        </div>

        {/* Symptoms */}
        {episode.symptoms.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {episode.symptoms.map((symptom) => (
                <span
                  key={symptom}
                  className="text-xs px-2 py-0.5 rounded-full bg-symptom-accent/10 text-symptom-accent"
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
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Treatments</p>
            <div className="flex flex-wrap gap-1.5">
              {episode.treatments.map((treatment) => (
                <span
                  key={treatment}
                  className="text-xs px-2 py-0.5 rounded-full bg-treatment-accent/10 text-treatment-accent"
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
