'use client';

import { useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FeverCalendarHeatmapProps {
  feverDays: string[]; // ISO date strings (YYYY-MM-DD)
  className?: string;
}

interface DayCell {
  date: Date;
  dateKey: string;
  hasFever: boolean;
  isCurrentMonth: boolean;
}

interface WeekColumn {
  days: (DayCell | null)[];
  monthLabel?: string;
}

export function FeverCalendarHeatmap({ feverDays, className }: FeverCalendarHeatmapProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feverDaySet = useMemo(() => new Set(feverDays), [feverDays]);

  // Scroll to the most recent date (right side) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 12 months ago, adjusted to start on a Sunday
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1); // First day of that month

    // Adjust to the previous Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks: WeekColumn[] = [];
    const monthLabels: { weekIndex: number; label: string }[] = [];
    let currentWeek: (DayCell | null)[] = [];
    let lastMonth = -1;
    let weekIndex = 0;

    for (
      const currentDate = new Date(startDate);
      currentDate <= today;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      // Use local date to match fever days computation
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const currentMonth = currentDate.getMonth();

      // Track month changes for labels
      if (currentMonth !== lastMonth) {
        const monthName = currentDate.toLocaleDateString('default', { month: 'short' });
        monthLabels.push({ weekIndex, label: monthName });
        lastMonth = currentMonth;
      }

      const cell: DayCell = {
        date: new Date(currentDate),
        dateKey,
        hasFever: feverDaySet.has(dateKey),
        isCurrentMonth: true,
      };

      currentWeek.push(cell);

      // End of week (Saturday)
      if (currentDate.getDay() === 6) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
        weekIndex++;
      }
    }

    // Push remaining days if any
    if (currentWeek.length > 0) {
      // Pad with nulls to complete the week
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push({ days: currentWeek });
    }

    return { weeks, monthLabels };
  }, [feverDaySet]);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div ref={scrollContainerRef} className={cn('overflow-x-auto', className)}>
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="flex ml-6 mb-1">
          {weeks.map((_, weekIndex) => {
            const monthLabel = monthLabels.find((m) => m.weekIndex === weekIndex);
            return (
              <div
                key={weekIndex}
                className="w-2.5 h-4 mr-0.5 text-[10px] text-muted-foreground"
              >
                {monthLabel?.label || ''}
              </div>
            );
          })}
        </div>

        {/* Calendar grid */}
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-1">
            {dayLabels.map((label, index) => (
              <div
                key={index}
                className="w-4 h-2.5 mb-0.5 text-[10px] text-muted-foreground flex items-center justify-end pr-1"
              >
                {index % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col">
                {week.days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={cn(
                      'w-2.5 h-2.5 rounded-sm mr-0.5 mb-0.5',
                      'print-calendar-cell',
                      day === null
                        ? 'bg-transparent'
                        : day.hasFever
                          ? 'bg-red-500 print-calendar-cell-fever'
                          : 'bg-gray-100 dark:bg-gray-800 print-calendar-cell-empty'
                    )}
                    title={day ? `${day.dateKey}${day.hasFever ? ' - Fever' : ''}` : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-gray-800 print-calendar-cell-empty" />
            <span>No fever</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500 print-calendar-cell-fever" />
            <span>Fever day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
