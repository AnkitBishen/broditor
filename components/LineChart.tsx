import { cx } from "@/lib/utils";
import type { TrendPoint } from "@/lib/types";

export function LineChart({
  data,
  className
}: {
  data: TrendPoint[];
  className?: string;
}) {
  const width = 520;
  const height = 220;
  const padding = 24;
  const max = Math.max(...data.map((point) => point.value), 1);
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (point.value / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className={cx("w-full", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible">
        <defs>
          <linearGradient id="line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(249,115,22,0.38)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0)" />
          </linearGradient>
        </defs>
        {data.map((point, index) => {
          const x = padding + index * stepX;
          return (
            <line
              key={point.label}
              x1={x}
              y1={padding}
              x2={x}
              y2={height - padding}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 6"
            />
          );
        })}
        <polygon points={areaPoints} fill="url(#line-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="rgba(249,115,22,0.95)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((point, index) => {
          const x = padding + index * stepX;
          const y = height - padding - (point.value / max) * (height - padding * 2);
          return (
            <g key={point.label}>
              <circle cx={x} cy={y} r="5" fill="#f97316" />
              <circle cx={x} cy={y} r="10" fill="rgba(249,115,22,0.15)" />
              <text x={x} y={height - 2} textAnchor="middle" fill="rgba(148,163,184,0.85)" fontSize="12">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
