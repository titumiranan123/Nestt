import type { ReactNode } from "react";
import { formatDashboardMoney, formatRevenueBucket } from "@/features/dashboard/format";
import { dashboardPeriods, type DashboardPeriod, type RevenuePoint } from "@/features/dashboard/types";

const chartLeft = 58;
const chartRight = 780;
const chartTop = 22;
const chartBottom = 202;
const tickCount = 4;

type ChartPoint = { start: string; amount: string; x: number; y: number };

function chartScale(values: RevenuePoint[]) {
  const max = Math.max(1, ...values.map(({ amount }) => Number(amount)));
  const step = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const factor = [1, 2, 5, 10].find((value) => value * magnitude >= step) ?? 10;
  return tickCount * factor * magnitude;
}

function smoothPath(points: ChartPoint[]) {
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const midpoint = (previous.x + point.x) / 2;
    path += ` C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }
  return path;
}

export function RevenueOverview({ period, series, feedback }: {
  period: DashboardPeriod;
  series?: RevenuePoint[];
  feedback: ReactNode;
}) {
  const label = dashboardPeriods[period];
  const interval = period === "today" ? "Hourly" : period === "year" ? "Monthly" : "Daily";

  return (
    <article className="min-w-0 rounded-lg border border-t-[3px] border-gray-200 border-t-brand bg-white p-4 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand">Performance</p>
          <h2 className="mt-1 text-base font-bold text-brand-dark">Revenue overview</h2>
          <p className="mt-1 text-sm text-gray-500">{interval} paid revenue · {label}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
          <i className="size-2 rounded-full bg-brand" aria-hidden="true" />Revenue
        </span>
      </header>

      <div className="mt-5 h-[260px] w-full">
        {series?.length ? <RevenueChart series={series} period={period} /> : <div className="grid h-full place-items-center">{feedback}</div>}
      </div>
    </article>
  );
}

function RevenueChart({ series, period }: { series: RevenuePoint[]; period: DashboardPeriod }) {
  const max = chartScale(series);
  const chartPoints = series.map((point, index) => ({
    ...point,
    x: series.length === 1 ? (chartLeft + chartRight) / 2 : chartLeft + index * ((chartRight - chartLeft) / (series.length - 1)),
    y: chartBottom - (Number(point.amount) / max) * (chartBottom - chartTop),
  }));
  const latest = chartPoints[chartPoints.length - 1];
  const revenuePath = smoothPath(chartPoints);
  const revenueAreaPath = `${revenuePath} L ${latest.x} ${chartBottom} L ${chartPoints[0].x} ${chartBottom} Z`;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => ({
    label: formatDashboardMoney(max * (1 - index / tickCount), true),
    y: chartTop + index * (chartBottom - chartTop) / tickCount,
  }));
  const xTickCount = Math.min(series.length, 7);
  const xTicks = Array.from({ length: xTickCount }, (_, index) => chartPoints[Math.round(index * (series.length - 1) / Math.max(1, xTickCount - 1))]);

  return (
        <svg className="size-full overflow-visible" viewBox="0 0 800 250" preserveAspectRatio="none" role="img" aria-label={`Revenue trend for ${dashboardPeriods[period]}`}>
          <title>Revenue trend for {dashboardPeriods[period]}</title>
          <defs>
            <linearGradient id="dashboard-revenue-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity=".18" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity=".015" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.y}>
              <text x="0" y={tick.y + 4} fill="#9ca3af" fontSize="11">{tick.label}</text>
              <line
                x1={chartLeft}
                x2={chartRight}
                y1={tick.y}
                y2={tick.y}
                stroke="#edf0f2"
                strokeWidth="1"
              />
            </g>
          ))}

          <path d={revenueAreaPath} fill="url(#dashboard-revenue-area)" />
          <path
            d={revenuePath}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={latest.x} cy={latest.y} r="8" fill="var(--brand)" fillOpacity=".12" />
          <circle cx={latest.x} cy={latest.y} r="4" fill="var(--brand)" stroke="white" strokeWidth="2" />
          {chartPoints.map(({ start, amount, x, y }) => <circle key={start} cx={x} cy={y} r="10" fill="transparent">
            <title>{formatRevenueBucket(start, period)} · {formatDashboardMoney(amount)}</title>
          </circle>)}
          {xTicks.map(({ start, x }) => <text key={start} x={x} y="238" textAnchor="middle" fill="#9ca3af" fontSize="11">{formatRevenueBucket(start, period)}</text>)}
        </svg>
  );
}
