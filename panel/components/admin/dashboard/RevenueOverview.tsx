const card = "min-w-0 rounded-lg border border-gray-200 bg-white";

const revenue = [
  38, 54, 43, 68, 52, 77, 61, 83, 69, 94, 72, 88,
  64, 101, 83, 111, 90, 118, 97, 128, 105, 137, 114, 145,
];

const chartLeft = 58;
const chartRight = 780;
const chartTop = 22;
const chartBottom = 202;
const chartPoints = revenue.map((value, index) => [
  chartLeft + index * ((chartRight - chartLeft) / (revenue.length - 1)),
  chartBottom - (value / 160) * (chartBottom - chartTop),
]);

function smoothPath(points: number[][]) {
  if (points.length === 0) return "";

  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;
    const controlOneX = current[0] + (next[0] - previous[0]) / 6;
    const controlOneY = current[1] + (next[1] - previous[1]) / 6;
    const controlTwoX = next[0] - (afterNext[0] - current[0]) / 6;
    const controlTwoY = next[1] - (afterNext[1] - current[1]) / 6;

    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next[0]} ${next[1]}`;
  }
  return path;
}

const revenuePath = smoothPath(chartPoints);
const revenueAreaPath = `${revenuePath} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z`;
const yTicks = [
  { label: "৳20k", y: chartTop },
  { label: "৳15k", y: chartTop + (chartBottom - chartTop) / 4 },
  { label: "৳10k", y: chartTop + (chartBottom - chartTop) / 2 },
  { label: "৳5k", y: chartTop + ((chartBottom - chartTop) * 3) / 4 },
  { label: "৳0", y: chartBottom },
];
const xTicks = [
  { index: 0, label: "Oct 1" },
  { index: 4, label: "Oct 5" },
  { index: 8, label: "Oct 10" },
  { index: 12, label: "Oct 15" },
  { index: 16, label: "Oct 20" },
  { index: 20, label: "Oct 25" },
  { index: 23, label: "Oct 28" },
];

export function RevenueOverview({ period }: { period: string }) {
  const latestPoint = chartPoints[chartPoints.length - 1];

  return (
    <article className={`${card} border-t-[3px] border-t-brand p-4 sm:p-5`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand">Performance</p>
          <h2 className="mt-1 text-base font-bold text-brand-dark">Revenue overview</h2>
          <p className="mt-1 text-sm text-gray-500">Daily performance for {period.toLowerCase()}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
          <i className="size-2 rounded-full bg-brand" aria-hidden="true" />Revenue
        </span>
      </header>

      <div className="mt-5 h-[260px] w-full" role="img" aria-label={`Revenue trend for ${period}`}>
        <svg className="size-full overflow-visible" viewBox="0 0 800 250" preserveAspectRatio="none">
          <title>Revenue trend for {period}</title>
          <defs>
            <linearGradient id="dashboard-revenue-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity=".18" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity=".015" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.label}>
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
          <circle cx={latestPoint[0]} cy={latestPoint[1]} r="8" fill="var(--brand)" fillOpacity=".12" />
          <circle cx={latestPoint[0]} cy={latestPoint[1]} r="4" fill="var(--brand)" stroke="white" strokeWidth="2" />

          {xTicks.map((tick) => {
            const x = chartPoints[tick.index][0];
            return <text key={tick.label} x={x} y="238" textAnchor="middle" fill="#9ca3af" fontSize="11">{tick.label}</text>;
          })}
        </svg>
      </div>
    </article>
  );
}
