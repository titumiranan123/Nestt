import type { LucideIcon } from "lucide-react";

export type CatalogStat = { label: string; value: string | number; icon: LucideIcon; note: string };

export default function CatalogStatsGrid({ stats }: { stats: CatalogStat[] }) {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {stats.map(({ label, value, icon: Icon, note }, index) => <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4" key={label}>
      <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><span className={`grid size-8 place-items-center rounded-full ${index === 0 ? "bg-brand-soft text-brand" : index === 1 ? "bg-green-50 text-green-700" : index === 2 ? "bg-amber-50 text-amber-700" : "bg-orange-50 text-orange-700"}`}><Icon size={16} strokeWidth={1.8}/></span></div>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p><p className="mt-1 text-xs text-gray-500">{note}</p>
    </article>)}
  </section>;
}
