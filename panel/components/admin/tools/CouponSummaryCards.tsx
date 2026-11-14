import { CheckCircle2, Tag, Users, XCircle } from "lucide-react";

const card = "rounded-xl border border-gray-200 bg-white shadow-sm";

export function CouponSummaryCards({ total, active, expired, uses }: { total: number; active: number; expired: number; uses: number }) {
  const stats = [{ title: "Total coupons", value: total, icon: Tag, tint: "bg-brand-soft text-brand" }, { title: "Active coupons", value: active, icon: CheckCircle2, tint: "bg-green-50 text-green-700" }, { title: "Expired coupons", value: expired, icon: XCircle, tint: "bg-red-50 text-red-700" }, { title: "Total uses", value: uses.toLocaleString(), icon: Users, tint: "bg-purple-50 text-purple-700" }];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ title, value, icon: Icon, tint }) => <article key={title} className={`${card} p-4`}><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p><span className={`grid size-9 place-items-center rounded-lg ${tint}`}><Icon size={17}/></span></div><p className="mt-2 text-2xl font-bold text-gray-950">{value}</p></article>)}</div>;
}
