'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReportStatistics } from '@/presentation/hooks/use-report-statistics';
import { PrintableReport } from '@/presentation/components/views/printable-report';
import { FeverCalendarHeatmap } from '@/presentation/components/views/fever-calendar-heatmap';
import { getSymptomLabel } from '@/domain/entities/symptom-entry';
import { getTreatmentLabel, getEffectivenessLabel } from '@/domain/entities/treatment-entry';
import type { Episode } from '@/domain/entities/episode';
import { ProtectedRoute } from '@/presentation/components/auth/protected-route';

export default function ReportsPage() {
  const { statistics, isLoading, error } = useReportStatistics();
  const [showPrintView, setShowPrintView] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    setShowPrintView(true);
    // Small delay to ensure the print view is rendered
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header onPrint={handlePrint} />
          <main className="container mx-auto px-4 py-6 max-w-md">
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header onPrint={handlePrint} />
          <main className="container mx-auto px-4 py-6 max-w-md">
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load statistics</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!statistics) {
    return <ProtectedRoute><></></ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header onPrint={handlePrint} />
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-md no-print">
        {/* Episode Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Episode Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatBox
                label="Total Episodes"
                value={statistics.totalEpisodes.toString()}
                highlight={statistics.activeEpisode !== null}
              />
              <StatBox
                label="Active Episode"
                value={statistics.activeEpisode ? 'Yes' : 'No'}
                highlight={statistics.activeEpisode !== null}
                highlightColor="red"
              />
              <StatBox
                label="Last 30 Days"
                value={statistics.episodesLast30Days.toString()}
              />
              <StatBox
                label="Last 90 Days"
                value={statistics.episodesLast90Days.toString()}
              />
            </div>

            {statistics.averageDurationHours !== null && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Duration Statistics</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="font-semibold">{statistics.averageDurationHours}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Longest</p>
                    <p className="font-semibold">{statistics.maxDurationHours}h</p>
                  </div>
                </div>
              </div>
            )}

            {statistics.maxTemperatureEver !== null && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Temperature Statistics</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Highest Ever</p>
                    <p className="font-semibold text-red-600">{statistics.maxTemperatureEver}°C</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Avg Max per Episode</p>
                    <p className="font-semibold">{statistics.averageMaxTemperature}°C</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fever Calendar Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Fever Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            {statistics.feverDays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No fever days recorded yet
              </p>
            ) : (
              <FeverCalendarHeatmap feverDays={statistics.feverDays} />
            )}
          </CardContent>
        </Card>

        {/* Symptom Frequency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Symptom Frequency</CardTitle>
            <p className="text-xs text-muted-foreground">% of episodes with each symptom</p>
          </CardHeader>
          <CardContent>
            {statistics.symptomFrequencies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No symptoms logged yet
              </p>
            ) : (
              <div className="space-y-3">
                {statistics.symptomFrequencies.slice(0, 6).map((item) => (
                  <div key={item.symptom}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{getSymptomLabel(item.symptom)}</span>
                      <span className="text-muted-foreground">
                        {item.count} {item.count === 1 ? 'episode' : 'episodes'} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treatment Effectiveness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Treatment Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            {statistics.treatmentEffectiveness.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No treatments logged yet
              </p>
            ) : (
              <div className="space-y-4">
                {statistics.treatmentEffectiveness.map((item) => (
                  <div key={item.treatment} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{getTreatmentLabel(item.treatment)}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.totalUses} uses
                      </span>
                    </div>
                    {item.averageEffectiveness !== null ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">Avg effectiveness:</span>
                          <span className="font-semibold">
                            {getEffectivenessLabel(Math.round(item.averageEffectiveness) as 1 | 2 | 3 | 4 | 5)}
                          </span>
                        </div>
                        <EffectivenessBar average={item.averageEffectiveness} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No effectiveness ratings yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Episodes Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Episodes</CardTitle>
          </CardHeader>
          <CardContent>
            {statistics.recentEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No episodes recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {statistics.recentEpisodes.map((episode) => (
                  <EpisodeCard key={episode.id} episode={episode} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

        {/* Printable Report - Hidden on screen, visible when printing */}
        {showPrintView && (
          <PrintableReport
            ref={printRef}
            statistics={statistics}
            episodes={statistics.recentEpisodes}
            feverDays={statistics.feverDays}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

interface HeaderProps {
  onPrint: () => void;
}

function Header({ onPrint }: HeaderProps) {
  return (
    <header className="border-b no-print">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Analytics and statistics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={onPrint}>
              Print Report
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: 'red' | 'green';
}

function StatBox({ label, value, highlight, highlightColor = 'green' }: StatBoxProps) {
  const bgColor = highlight
    ? highlightColor === 'red'
      ? 'bg-red-50 dark:bg-red-950/20 border-red-200'
      : 'bg-green-50 dark:bg-green-950/20 border-green-200'
    : 'bg-muted/50';

  const textColor = highlight
    ? highlightColor === 'red'
      ? 'text-red-600'
      : 'text-green-600'
    : '';

  return (
    <div className={`rounded-lg p-3 border ${bgColor}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}

interface EffectivenessBarProps {
  average: number;
}

function EffectivenessBar({ average }: EffectivenessBarProps) {
  const percentage = (average / 5) * 100;
  const colorClass =
    average >= 4
      ? 'bg-green-500'
      : average >= 3
      ? 'bg-yellow-500'
      : average >= 2
      ? 'bg-orange-500'
      : 'bg-red-500';

  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
}

function EpisodeCard({ episode }: EpisodeCardProps) {
  const startDate = new Date(episode.startDate);
  const formattedDate = new Intl.DateTimeFormat('default', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(startDate);

  return (
    <div
      className={`rounded-lg border p-3 ${
        episode.isActive
          ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
          : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            Duration: {episode.durationHours}h
          </p>
        </div>
        {episode.isActive && (
          <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-2 py-0.5 rounded">
            Active
          </span>
        )}
        {episode.maxTemperature && (
          <span className="text-sm font-semibold text-red-600">
            {episode.maxTemperature}°C
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {episode.symptoms.slice(0, 3).map((symptom) => (
          <span
            key={symptom}
            className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 px-2 py-0.5 rounded"
          >
            {getSymptomLabel(symptom)}
          </span>
        ))}
        {episode.symptoms.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{episode.symptoms.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}
