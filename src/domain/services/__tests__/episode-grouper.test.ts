import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EpisodeGrouper, EPISODE_GAP_HOURS } from '../episode-grouper';
import type { EpisodeEvent } from '../../entities/episode';
import { createTemperatureReading } from '../../entities/temperature-reading';
import { createSymptomEntry } from '../../entities/symptom-entry';

// Helper to create timestamps relative to a base time
function hoursFromBase(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

// Constants for readable test times (in hours relative to base)
const WITHIN_EPISODE = EPISODE_GAP_HOURS / 10; // ~4.8h - within same episode
const AFTER_GAP = 2 * EPISODE_GAP_HOURS; // 96h - triggers new episode

describe('EpisodeGrouper', () => {
  let grouper: EpisodeGrouper;
  let baseTime: Date;

  beforeEach(() => {
    grouper = new EpisodeGrouper();
    baseTime = new Date('2024-01-01T00:00:00Z');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic episode grouping', () => {
    it('should return empty array for no events', () => {
      const result = grouper.group([]);
      expect(result).toEqual([]);
    });

    it('should create single episode with fever and symptom within gap', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createSymptomEntry('s1', 'sore_throat', hoursFromBase(baseTime, WITHIN_EPISODE)),
        createTemperatureReading('t2', 38.2, hoursFromBase(baseTime, WITHIN_EPISODE * 2)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      expect(result[0].events).toHaveLength(3);
      expect(result[0].maxTemperature).toBe(38.5);
    });

    it('should not create episode without fever temperature', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 37.0, baseTime), // Normal temp
        createSymptomEntry('s1', 'sore_throat', hoursFromBase(baseTime, WITHIN_EPISODE)),
        createTemperatureReading('t2', 37.2, hoursFromBase(baseTime, WITHIN_EPISODE * 2)), // Normal temp
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(0);
    });
  });

  describe('gap detection and episode splitting', () => {
    it('should create two episodes when gap exceeds threshold', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createTemperatureReading('t2', 38.2, hoursFromBase(baseTime, WITHIN_EPISODE)),
        createTemperatureReading('t3', 38.3, hoursFromBase(baseTime, AFTER_GAP)), // New episode
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(2);
      // Results sorted descending by start date
      expect(result[0].events).toHaveLength(1); // Episode 2 (most recent)
      expect(result[1].events).toHaveLength(2); // Episode 1
    });

    it('should NOT assign symptoms before first fever to any episode', () => {
      const events: EpisodeEvent[] = [
        createSymptomEntry('s1', 'sore_throat', baseTime), // Before fever
        createTemperatureReading('t1', 38.5, hoursFromBase(baseTime, WITHIN_EPISODE)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      expect(result[0].events).toHaveLength(1); // Only the fever
      expect(result[0].events[0].id).toBe('t1');
    });

    it('should NOT assign orphan symptoms (after cutoff, before next fever) to any episode', () => {
      // Episode 1: fever at t=0
      // Orphan: symptom at t=GAP+WITHIN_EPISODE (after cutoff)
      // Episode 2: fever at t=AFTER_GAP
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime), // Episode 1
        createSymptomEntry('orphan', 'coughing', hoursFromBase(baseTime, EPISODE_GAP_HOURS + WITHIN_EPISODE)), // After cutoff
        createTemperatureReading('t2', 38.3, hoursFromBase(baseTime, AFTER_GAP)), // Episode 2
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(2);

      // Episode 2 (most recent, index 0) should only have the fever
      expect(result[0].events).toHaveLength(1);
      expect(result[0].events[0].id).toBe('t2');

      // Episode 1 should only have its fever
      expect(result[1].events).toHaveLength(1);
      expect(result[1].events[0].id).toBe('t1');

      // The orphan symptom should not be in either episode
      const allEventIds = [...result[0].events, ...result[1].events].map(e => e.id);
      expect(allEventIds).not.toContain('orphan');
    });

    it('should include symptoms within episode window', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createSymptomEntry('s1', 'sore_throat', hoursFromBase(baseTime, WITHIN_EPISODE)),
        createTemperatureReading('t2', 38.2, hoursFromBase(baseTime, WITHIN_EPISODE * 2)),
        createSymptomEntry('s2', 'fatigue', hoursFromBase(baseTime, WITHIN_EPISODE * 3)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      expect(result[0].events).toHaveLength(4);
      expect(result[0].symptoms).toContain('sore_throat');
      expect(result[0].symptoms).toContain('fatigue');
    });

    it('should include events up to cutoff time when gap detected', () => {
      // Fever at t=0, symptom at t=WITHIN_EPISODE (within cutoff)
      // symptom at t=GAP+WITHIN_EPISODE (after cutoff)
      // New fever at t=AFTER_GAP
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createSymptomEntry('s1', 'sore_throat', hoursFromBase(baseTime, WITHIN_EPISODE)), // Within cutoff
        createSymptomEntry('s2', 'coughing', hoursFromBase(baseTime, EPISODE_GAP_HOURS + WITHIN_EPISODE)), // After cutoff
        createTemperatureReading('t2', 38.3, hoursFromBase(baseTime, AFTER_GAP)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(2);

      // Episode 1 should have fever + symptom within cutoff
      expect(result[1].events).toHaveLength(2);
      expect(result[1].events.map(e => e.id)).toContain('t1');
      expect(result[1].events.map(e => e.id)).toContain('s1');

      // Episode 2 should only have the new fever
      expect(result[0].events).toHaveLength(1);
      expect(result[0].events[0].id).toBe('t2');
    });
  });

  describe('isActive calculation', () => {
    it('should mark episode as active if last fever is within gap threshold', () => {
      const now = hoursFromBase(baseTime, WITHIN_EPISODE);
      vi.setSystemTime(now);

      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should mark episode as inactive if last fever is beyond gap threshold', () => {
      const now = hoursFromBase(baseTime, AFTER_GAP);
      vi.setSystemTime(now);

      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(false);
    });

    it('should base isActive on last fever time, not last event time', () => {
      // Fever at t=0, symptom at t=GAP-1 (within gap but close to edge)
      // Set current time to t=GAP+1 - after fever gap but symptom still recent
      const now = hoursFromBase(baseTime, EPISODE_GAP_HOURS + 1);
      vi.setSystemTime(now);

      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createSymptomEntry('s1', 'sore_throat', hoursFromBase(baseTime, EPISODE_GAP_HOURS - 1)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      // Should be inactive because last FEVER was > GAP hours ago
      // Even though symptom was logged more recently
      expect(result[0].isActive).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple orphan symptoms between episodes', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createSymptomEntry('orphan1', 'sore_throat', hoursFromBase(baseTime, EPISODE_GAP_HOURS + 1)),
        createSymptomEntry('orphan2', 'fatigue', hoursFromBase(baseTime, EPISODE_GAP_HOURS + 10)),
        createSymptomEntry('orphan3', 'coughing', hoursFromBase(baseTime, AFTER_GAP - 1)),
        createTemperatureReading('t2', 38.3, hoursFromBase(baseTime, AFTER_GAP)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(2);

      // No orphan symptoms should be in any episode
      const allEventIds = [...result[0].events, ...result[1].events].map(e => e.id);
      expect(allEventIds).not.toContain('orphan1');
      expect(allEventIds).not.toContain('orphan2');
      expect(allEventIds).not.toContain('orphan3');
    });

    it('should handle exact gap boundary correctly', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createTemperatureReading('t2', 38.3, hoursFromBase(baseTime, EPISODE_GAP_HOURS)), // Exactly at gap
      ];

      const result = grouper.group(events);

      // Gap is >= threshold, so should be 2 episodes
      expect(result).toHaveLength(2);
    });

    it('should handle events in random order', () => {
      const events: EpisodeEvent[] = [
        createSymptomEntry('s1', 'sore_throat', hoursFromBase(baseTime, WITHIN_EPISODE)), // Middle
        createTemperatureReading('t2', 38.2, hoursFromBase(baseTime, WITHIN_EPISODE * 2)), // End
        createTemperatureReading('t1', 38.5, baseTime), // Start (out of order)
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(1);
      expect(result[0].events).toHaveLength(3);
      // Events should be sorted by timestamp in the episode
      expect(result[0].events[0].id).toBe('t1');
    });

    it('should sort episodes by start date descending (most recent first)', () => {
      const events: EpisodeEvent[] = [
        createTemperatureReading('t1', 38.5, baseTime),
        createTemperatureReading('t2', 38.3, hoursFromBase(baseTime, AFTER_GAP)),
        createTemperatureReading('t3', 38.1, hoursFromBase(baseTime, AFTER_GAP * 2)),
      ];

      const result = grouper.group(events);

      expect(result).toHaveLength(3);
      // Most recent first
      expect(result[0].events[0].id).toBe('t3');
      expect(result[1].events[0].id).toBe('t2');
      expect(result[2].events[0].id).toBe('t1');
    });
  });
});
