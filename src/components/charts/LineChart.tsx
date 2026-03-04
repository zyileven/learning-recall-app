interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
}

export function LineChart({ data, height = 120, color = 'hsl(var(--primary))' }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  const WIDTH = 560;
  const PAD_LEFT = 30;
  const PAD_RIGHT = 10;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 24;
  const chartW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  // Round up to a nice number
  const yMax = Math.ceil(maxVal / 5) * 5 || 5;

  const toX = (i: number) =>
    PAD_LEFT + (i / (data.length - 1 || 1)) * chartW;

  const toY = (v: number) =>
    PAD_TOP + chartH - (v / yMax) * chartH;

  const points = data
    .map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`)
    .join(' ');

  // Area fill path
  const firstX = toX(0).toFixed(1);
  const lastX = toX(data.length - 1).toFixed(1);
  const baseY = (PAD_TOP + chartH).toFixed(1);
  const areaPath = `M ${firstX},${baseY} L ${points
    .split(' ')
    .map((p) => `${p}`)
    .join(' L ')} L ${lastX},${baseY} Z`;

  // Y-axis tick values
  const yTicks = [0, Math.round(yMax / 2), yMax];

  // X-axis: show only first, middle, last labels (or every N if dense)
  const xLabelIndices = new Set<number>([0, Math.floor(data.length / 2), data.length - 1]);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        style={{ width: '100%', minWidth: 300, height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD_LEFT}
              y1={toY(tick)}
              x2={WIDTH - PAD_RIGHT}
              y2={toY(tick)}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              strokeDasharray="4 3"
            />
            <text
              x={PAD_LEFT - 4}
              y={toY(tick) + 4}
              textAnchor="end"
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={color} fillOpacity={0.08} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots + X labels */}
        {data.map((d, i) => (
          <g key={i}>
            {/* Dot */}
            <circle
              cx={toX(i)}
              cy={toY(d.value)}
              r={d.value > 0 ? 3 : 2}
              fill={d.value > 0 ? color : 'hsl(var(--muted))'}
            />
            {/* Tooltip-style value on hover – simplified: show for non-zero values */}
            {d.value > 0 && (
              <text
                x={toX(i)}
                y={toY(d.value) - 6}
                textAnchor="middle"
                fontSize={8}
                fill={color}
              >
                {d.value}
              </text>
            )}
            {/* X label */}
            {xLabelIndices.has(i) && (
              <text
                x={toX(i)}
                y={height - 4}
                textAnchor="middle"
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
              >
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
