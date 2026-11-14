import { ShoppingBag, Timer, CreditCard, TrendingUp } from "lucide-react";

const card = "rounded-lg border border-gray-200 bg-white";

export function OrderStatsGrid({ stats }: { stats: Array<[string, string, string]> }) {
  const icons = [ShoppingBag, Timer, CreditCard, TrendingUp];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, note], index) => { const Icon = icons[index]; const accent = index > 1; return <article className={`${card} border-t-[3px] ${accent ? "border-t-accent" : "border-t-brand"} p-4 sm:p-5`} key={label}><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><span className={`grid size-9 place-items-center rounded-xl ${accent ? "bg-orange-50 text-accent" : "bg-brand-soft text-brand"}`}><Icon aria-hidden="true" size={17} strokeWidth={1.8}/></span></div><p className={`mt-2 text-2xl font-bold ${accent ? "text-accent" : "text-brand-dark"}`}>{value}</p><p className="mt-1 text-xs text-gray-500">{note}</p></article>; })}</section>;
}
