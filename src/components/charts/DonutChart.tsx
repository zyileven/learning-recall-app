interface DonutSegment {
  label: string;
  value: number;
  color: string;
  emoji?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({ segments, size = 160, strokeWidth = 28 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // Calculate dash offsets for each segment
  let cumulativeOffset = 0;
  // Start from top (rotate -90°)
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const offset = cumulativeOffset;
    cumulativeOffset += dash;
    return { ...seg, dash, gap, offset };
  });

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-full border-4 border-muted"
        >
          <span className="text-xs text-muted-foreground">暂无数据</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG donut */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ flexShrink: 0 }}
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {arcs.map((arc, i) => (
          arc.value > 0 && (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset + circumference / 4}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          )
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" fontSize="22" fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
          总卡片
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 min-w-[140px]">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-sm flex-1">
                {seg.emoji && <span className="mr-1">{seg.emoji}</span>}
                {seg.label}
              </span>
              <span className="text-sm font-semibold">{seg.value}</span>
              <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
