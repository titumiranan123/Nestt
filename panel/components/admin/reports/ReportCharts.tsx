"use client";

type Point = { label: string; value: number; comparison?: number };
type Slice = { label: string; value: number; color: string };
const colors = ["#e96855", "#5488d8", "#55a987", "#e6a944", "#9972cc", "#55adba"];

export function TrendChart({ data, label = "Value", color = colors[0], comparisonLabel }: { data: Point[]; label?: string; color?: string; comparisonLabel?: string }) {
  const safe = data.slice(-14);
  const max = Math.max(1, ...safe.map((point) => point.value));
  const points = safe.map((point, index) => `${safe.length < 2 ? 50 : 28 + index * (264 / (safe.length - 1))},${160 - (point.value / max) * 132}`).join(" ");
  const comparisonPoints = safe.map((point, index) => `${safe.length < 2 ? 50 : 28 + index * (264 / (safe.length - 1))},${160 - ((point.comparison ?? 0) / max) * 132}`).join(" ");
  const area = safe.length ? `28,160 ${points} ${28 + Math.max(0, safe.length - 1) * (264 / Math.max(1, safe.length - 1))},160` : "28,160 292,160";
  return <div><div className="h-64 w-full p-2" role="img" aria-label={`${label} trend chart`}><svg viewBox="0 0 320 190" className="h-full w-full" preserveAspectRatio="none"><defs><linearGradient id="reportTrendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity=".01"/></linearGradient></defs>{[28,72,116,160].map((y) => <line key={y} x1="28" x2="300" y1={y} y2={y} stroke="#e9edf2" strokeDasharray="4 5"/>)}<polygon points={area} fill="url(#reportTrendFill)"/>{safe.length > 1 && <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}{comparisonLabel && safe.length > 1 && <polyline points={comparisonPoints} fill="none" stroke="#08779a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>}{safe.map((point, i) => { const x = safe.length < 2 ? 160 : 28 + i * (264 / (safe.length - 1)); const y = 160 - (point.value / max) * 132; return <g key={`${point.label}-${i}`}><circle cx={x} cy={y} r="4" fill="white" stroke={color} strokeWidth="2.5"><title>{`${point.label}: ${point.value.toLocaleString()}`}</title></circle></g>; })}{safe.length > 0 && <><text x="28" y="184" fill="#697586" fontSize="10">{safe[0].label}</text><text x="292" y="184" textAnchor="end" fill="#697586" fontSize="10">{safe.at(-1)?.label}</text></>}</svg></div>{comparisonLabel && <div className="flex justify-center gap-4 text-xs text-gray-500"><span style={{ color }}>● {label}</span><span className="text-[#08779a]">● {comparisonLabel}</span></div>}</div>;
}

export function RankedBars({ data, label = "Value" }: { data: Point[]; label?: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <div className="space-y-4">{data.slice(0, 7).map((item, index) => <div key={`${item.label}-${index}`}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate font-medium text-gray-700">{item.label}</span><span className="shrink-0 font-semibold text-ink">{label === "Revenue" ? `৳${item.value.toLocaleString()}` : item.value.toLocaleString()}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full transition-all" style={{ width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / max) * 100)}%`, backgroundColor: colors[index % colors.length] }}/></div></div>)}{data.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No data for this period.</p>}</div>;
}

export function ColumnChart({ data, label = "Value", color = colors[0] }: { data: Point[]; label?: string; color?: string }) {
  const visible = data.slice(-6);
  const max = Math.max(1, ...visible.map((item) => item.value));
  return <div className="h-64 w-full" role="img" aria-label={`${label} by period`}><svg viewBox="0 0 420 220" className="h-full w-full" preserveAspectRatio="none">{[30,70,110,150,190].map((y) => <line key={y} x1="38" x2="410" y1={y} y2={y} stroke="#e9edf2" strokeDasharray="4 5"/>)}{visible.map((item, index) => { const width = Math.min(46, 300 / Math.max(1, visible.length)); const x = 45 + index * (360 / Math.max(1, visible.length)) + (360 / Math.max(1, visible.length) - width) / 2; const height = item.value / max * 150; return <g key={`${item.label}-${index}`}><rect x={x} y={190 - height} width={width} height={height} rx="5" fill={color}/><text x={x + width / 2} y={185 - height} textAnchor="middle" fill="#263442" fontSize="11" fontWeight="600">{item.value.toLocaleString()}</text><text x={x + width / 2} y="210" textAnchor="middle" fill="#697586" fontSize="10">{item.label}</text></g>; })}</svg>{visible.length === 0 && <p className="-mt-32 text-center text-sm text-gray-500">No data for this period.</p>}</div>;
}

export function DonutChart({ data, center }: { data: Slice[]; center: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const segments = data.map((item) => { const fraction = total ? item.value / total : 0; const segment = { ...item, dash: fraction * 100, offset }; offset += fraction * 100; return segment; });
  return <div className="flex min-h-64 flex-wrap items-center justify-center gap-8 py-3"><div className="relative h-44 w-44"><svg viewBox="0 0 42 42" className="h-full w-full -rotate-90"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#eef1f5" strokeWidth="6"/>{segments.map((item, index) => <circle key={`${item.label}-${index}`} cx="21" cy="21" r="15.9" fill="none" stroke={item.color} strokeWidth="6" strokeDasharray={`${item.dash} ${100 - item.dash}`} strokeDashoffset={-item.offset}><title>{`${item.label}: ${item.value}`}</title></circle>)}</svg><div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl text-ink">{center}</strong><span className="text-xs text-gray-500">Total</span></div></div><div className="grid gap-3">{data.map((item) => <div className="flex items-center gap-2 text-sm" key={item.label}><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }}/><span className="text-gray-600">{item.label}</span><strong className="ml-2 text-ink">{item.value.toLocaleString()}</strong></div>)}</div></div>;
}

export function CompareBars({ data }: { data: Array<{ label: string; primary: number; secondary: number }> }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.primary, item.secondary]));
  return <div className="space-y-4">{data.slice(-8).map((item, index) => <div key={`${item.label}-${index}`}><div className="mb-1 text-xs font-medium text-gray-500">{item.label}</div><div className="grid gap-1"><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#e96855]" style={{ width: `${item.primary / max * 100}%` }}/></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#5488d8]" style={{ width: `${item.secondary / max * 100}%` }}/></div></div></div>)}</div>;
}
