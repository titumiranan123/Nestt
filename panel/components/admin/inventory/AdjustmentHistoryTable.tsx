import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { formatInventoryDate, type AdjustmentItem } from "@/lib/inventory-media-demo";

export function AdjustmentHistoryTable({ items }: { items: AdjustmentItem[] }) {
  const typeColors: Record<string, string> = {
    PURCHASE: "bg-brand-soft text-brand", SALE: "bg-orange-50 text-accent", RETURN: "bg-emerald-50 text-emerald-700",
    CORRECTION: "bg-violet-50 text-violet-700", DAMAGE: "bg-rose-50 text-rose-700", TRANSFER: "bg-amber-50 text-amber-700",
  };
  return <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
    <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
<div className="flex items-center gap-3">
<span className="grid size-9 place-items-center rounded-lg bg-orange-50 text-accent">
<History size={17} />
</span>
<div>
<h2 className="text-sm font-bold text-gray-900">Recent activity</h2>
<p className="mt-0.5 text-xs text-gray-500">An audit trail of manual stock movements</p>
</div>
</div>
<span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{items.length} records</span>
</header>
    <div className="overflow-x-auto">
<table className="w-full min-w-[850px] text-left text-sm">
      <thead className="bg-gray-50/80 text-[10px] font-bold uppercase tracking-wide text-gray-500">
<tr>{["Date", "Product", "Type", "Quantity", "Reason", "Updated by"].map((head) => <th key={head} className="px-4 py-3.5">{head}</th>)}</tr>
</thead>
      <tbody className="divide-y divide-gray-100">{items.map((entry) => <tr key={entry.id} className="transition hover:bg-brand-soft/20">
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500">{formatInventoryDate(entry.createdAt)}</td>
        <td className="px-4 py-3.5">
<strong className="block text-sm font-semibold text-gray-800">{entry.product}</strong>
<small className="mt-0.5 block font-mono text-[10px] text-gray-500">{entry.sku} · {entry.variant}</small>
</td>
        <td className="px-4 py-3.5">
<span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${typeColors[entry.type]}`}>{entry.type}</span>
</td>
        <td className="px-4 py-3.5">
<span className={`inline-flex items-center gap-1 font-bold ${entry.quantity >= 0 ? "text-brand" : "text-accent"}`}>{entry.quantity >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{entry.quantity > 0 ? "+" : ""}{entry.quantity}</span>
</td>
        <td className="max-w-[220px] truncate px-4 py-3.5 text-xs text-gray-600" title={entry.reason}>{entry.reason}</td>
<td className="px-4 py-3.5 text-xs font-medium text-gray-700">{entry.user}</td>
      </tr>)}
      {!items.length && <tr>
<td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">No stock movements match these filters.</td>
</tr>}</tbody>
    </table>
</div>
    <footer className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-5">Showing the latest {items.length} stock movements</footer>
  </section>;
}
