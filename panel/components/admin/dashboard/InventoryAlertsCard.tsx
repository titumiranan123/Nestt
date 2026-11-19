import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardStockAlert } from "@/features/dashboard/types";

export function InventoryAlertsCard({ count, items, feedback, showLink }: {
  count?: number;
  items?: DashboardStockAlert[];
  feedback: ReactNode;
  showLink: boolean;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-t-[3px] border-gray-200 border-t-brand bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand">Needs attention</p>
          <h2 className="mt-1 text-base font-bold text-brand-dark">Inventory alerts</h2>
          <p className="mt-1 text-sm text-gray-500">Products that need a restock</p>
        </div>
        <span className="grid min-h-8 min-w-8 place-items-center rounded-lg bg-brand px-1 text-xs font-bold text-white shadow-sm">{count?.toLocaleString("en-BD") ?? "—"}</span>
      </div>
      <div className="mt-3">
        {items?.map(({ sku, product, available }) => (
          <div key={sku} className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-0">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft"><span className="h-6 w-5 rounded border border-brand/50 bg-brand/25" /></div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-medium text-gray-800">{product}</strong>
              <small className="mt-0.5 block text-xs text-gray-500">SKU: {sku}</small>
            </div>
            <span className="text-xs font-bold text-brand">{available.toLocaleString("en-BD")} left</span>
          </div>
        ))}
        {!items && <div className="py-4 text-sm text-gray-500">{feedback}</div>}
        {items?.length === 0 && <p className="py-4 text-sm text-gray-500">No low-stock variants.</p>}
      </div>
      {showLink && <Link href="/admin/inventory/low-stock" className="ml-auto mt-3 flex w-fit items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">View inventory <ArrowRight size={15} /></Link>}
    </article>
  );
}
