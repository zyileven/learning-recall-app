import { useMemo, useState } from 'react';

interface HeatMapProps {
  /** Map of date string (YYYY-MM-DD) → count */
  data: Record<string, number>;
  /** How many days to show (default 91) */
  days?: number;
}

function colorForCount(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count <= 3) return 'bg-green-200';
  if (count <= 7) return 'bg-green-400';
  return 'bg-green-600';
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function HeatMap({ data, days = 91 }: HeatMapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);

  const cells = useMemo(() => {
    const result: Array<{ date: string; count: number; dayOfWeek: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: data[dateStr] ?? 0,
        dayOfWeek: d.getDay(),
      });
    }
    return result;
  }, [data, days]);

  // Group into weeks (columns)
  const weeks = useMemo(() => {
    const result: typeof cells[] = [];
    let week: typeof cells = [];

    // Pad first week with empty slots
    const firstDow = cells[0]?.dayOfWeek ?? 0;
    for (let i = 0; i < firstDow; i++) {
      week.push({ date: '', count: -1, dayOfWeek: i });
    }

    for (const cell of cells) {
      week.push(cell);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }
    if (week.length > 0) result.push(week);
    return result;
  }, [cells]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; colIdx: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstReal = week.find((c) => c.date !== '');
      if (!firstReal) return;
      const m = new Date(firstReal.date).getMonth();
      if (m !== lastMonth) {
        labels.push({ label: `${m + 1}月`, colIdx: wi });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex mb-1 pl-6">
          {weeks.map((_, wi) => {
            const ml = monthLabels.find((l) => l.colIdx === wi);
            return (
              <div key={wi} className="w-4 mr-0.5 text-xs text-muted-foreground" style={{ minWidth: 16 }}>
                {ml ? ml.label : ''}
              </div>
            );
          })}
        </div>

        <div className="flex gap-0">
          {/* Weekday labels */}
          <div className="flex flex-col mr-1 gap-0.5 pt-0">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="h-4 text-[10px] text-muted-foreground flex items-center">
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-opacity hover:opacity-70 ${
                      cell.count < 0 ? 'opacity-0' : colorForCount(cell.count)
                    }`}
                    onMouseEnter={() => cell.date && setTooltip({ date: cell.date, count: cell.count })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 pl-6">
          <span className="text-xs text-muted-foreground">少</span>
          {['bg-muted', 'bg-green-200', 'bg-green-400', 'bg-green-600'].map((cls) => (
            <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span className="text-xs text-muted-foreground">多</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 text-xs text-muted-foreground">
          {tooltip.date}：{tooltip.count === 0 ? '未学习' : `复习了 ${tooltip.count} 张`}
        </div>
      )}
    </div>
  );
}
