import type { Episode } from '@/domain/entities/episode';
import type { SymptomType } from '@/domain/entities/symptom-entry';
import type { EventRepository } from '@/application/ports/event-repository';
import { ComputeEpisodes } from './compute-episodes';

export interface SymptomFrequency {
  symptom: SymptomType;
  count: number;
  percentage: number;
}

export interface TreatmentEffectiveness {
  treatment: string;
  totalUses: number;
  averageEffectiveness: number | null;
  effectivenessBreakdown: Record<number, number>;
}

export interface ReportStatistics {
  // Episode statistics
  totalEpisodes: number;
  activeEpisode: Episode | null;
  averageDurationHours: number | null;
  maxDurationHours: number | null;
  minDurationHours: number | null;
  episodesLast30Days: number;
  episodesLast90Days: number;

  // Temperature statistics
  maxTemperatureEver: number | null;
  averageMaxTemperature: number | null;

  // Symptom statistics
  symptomFrequencies: SymptomFrequency[];
  totalSymptomEntries: number;

  // Treatment statistics
  treatmentEffectiveness: TreatmentEffectiveness[];
  totalTreatmentEntries: number;

  // Recent episodes for timeline
  recentEpisodes: Episode[];
}

/**
 * Use case for computing report statistics from all events and episodes.
 */
export class ComputeReportStatistics {
  constructor(private readonly eventRepository: EventRepository) {}

  async execute(): Promise<ReportStatistics> {
    // Get all episodes
    const computeEpisodes = new ComputeEpisodes(this.eventRepository);
    const episodes = await computeEpisodes.execute();

    // Get all events for detailed analysis
    const allEvents = await this.eventRepository.getAll();
    const symptomEntries = allEvents.filter((e) => e.type === 'symptom');
    const treatmentEntries = allEvents.filter((e) => e.type === 'treatment');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Find active episode
    const activeEpisode = episodes.find((e) => e.isActive) || null;

    // Calculate episode statistics
    const completedEpisodes = episodes.filter((e) => !e.isActive);
    const durations = completedEpisodes.map((e) => e.durationHours);

    const averageDurationHours = durations.length > 0
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : null;

    const maxDurationHours = durations.length > 0 ? Math.max(...durations) : null;
    const minDurationHours = durations.length > 0 ? Math.min(...durations) : null;

    // Episodes in time periods
    const episodesLast30Days = episodes.filter(
      (e) => new Date(e.startDate) >= thirtyDaysAgo
    ).length;

    const episodesLast90Days = episodes.filter(
      (e) => new Date(e.startDate) >= ninetyDaysAgo
    ).length;

    // Temperature statistics
    const maxTemperatures = episodes
      .map((e) => e.maxTemperature)
      .filter((t): t is number => t !== null);

    const maxTemperatureEver = maxTemperatures.length > 0
      ? Math.max(...maxTemperatures)
      : null;

    const averageMaxTemperature = maxTemperatures.length > 0
      ? Math.round((maxTemperatures.reduce((a, b) => a + b, 0) / maxTemperatures.length) * 10) / 10
      : null;

    // Symptom frequency
    const symptomCounts: Record<string, number> = {};
    for (const entry of symptomEntries) {
      if (entry.type === 'symptom') {
        const symptom = entry.symptom;
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      }
    }

    const totalSymptomEntries = symptomEntries.length;
    const symptomFrequencies: SymptomFrequency[] = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({
        symptom,
        count,
        percentage: totalSymptomEntries > 0
          ? Math.round((count / totalSymptomEntries) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Treatment effectiveness
    const treatmentStats: Record<string, { uses: number; effectivenessSum: number; effectivenessCount: number; breakdown: Record<number, number> }> = {};

    for (const entry of treatmentEntries) {
      if (entry.type === 'treatment') {
        const treatment = entry.treatment;
        if (!treatmentStats[treatment]) {
          treatmentStats[treatment] = { uses: 0, effectivenessSum: 0, effectivenessCount: 0, breakdown: {} };
        }
        treatmentStats[treatment].uses++;
        if (entry.effectiveness) {
          treatmentStats[treatment].effectivenessSum += entry.effectiveness;
          treatmentStats[treatment].effectivenessCount++;
          treatmentStats[treatment].breakdown[entry.effectiveness] =
            (treatmentStats[treatment].breakdown[entry.effectiveness] || 0) + 1;
        }
      }
    }

    const treatmentEffectiveness: TreatmentEffectiveness[] = Object.entries(treatmentStats)
      .map(([treatment, stats]) => ({
        treatment,
        totalUses: stats.uses,
        averageEffectiveness: stats.effectivenessCount > 0
          ? Math.round((stats.effectivenessSum / stats.effectivenessCount) * 10) / 10
          : null,
        effectivenessBreakdown: stats.breakdown,
      }))
      .sort((a, b) => b.totalUses - a.totalUses);

    // Recent episodes (last 5)
    const recentEpisodes = [...episodes]
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 5);

    return {
      totalEpisodes: episodes.length,
      activeEpisode,
      averageDurationHours,
      maxDurationHours,
      minDurationHours,
      episodesLast30Days,
      episodesLast90Days,
      maxTemperatureEver,
      averageMaxTemperature,
      symptomFrequencies,
      totalSymptomEntries,
      treatmentEffectiveness,
      totalTreatmentEntries: treatmentEntries.length,
      recentEpisodes,
    };
  }
}
