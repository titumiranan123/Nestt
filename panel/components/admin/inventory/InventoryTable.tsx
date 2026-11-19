"use client";

import { AlertCircle, MoreHorizontal, Pencil, Package } from "lucide-react";
import type { InventoryItem, InventoryStatus } from "@/features/inventory/types";
import { exportInventory } from "@/features/inventory/utils";
import { usePermission } from "@/hooks/use-permission";
import { AdminRequestState, type AdminRequest } from "@/components/admin/AdminRequestState";

const statuses: Record<InventoryStatus, { label: string; className: string }> = {
  IN_STOCK: { label: "In stock", className: "bg-brand-soft text-brand" },
  LOW_STOCK: { label: "Low stock", className: "bg-orange-50 text-accent" },
  OUT_OF_STOCK: { label: "Out of stock", className: "bg-rose-50 text-rose-700" },
  PREORDER: { label: "Backorder", className: "bg-amber-50 text-amber-700" },
};

const swatches = ["bg-amber-200", "bg-orange-200", "bg-stone-300", "bg-green-200", "bg-yellow-200"];

export function InventoryTable({ items, request, onEditThreshold }: {
  items?: InventoryItem[];
  request: AdminRequest;
  onEditThreshold?: (item: InventoryItem) => void;
}) {
  const canExport = usePermission("inventory:export");

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
        <div><h2 className="text-sm font-bold text-gray-900">Stock by product variant</h2><p className="mt-0.5 text-xs text-gray-500">Review availability, reservations, and reorder points</p></div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">{items?.length ?? "—"} variants</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-gray-50/80 text-[11px] font-bold uppercase tracking-wide text-gray-500">
            <tr>{["Product", "SKU", "Category", "Stock", "Reserved", "Alert qty", "Status", ""].map((heading) => <th key={heading} className="px-4 py-3.5">{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items?.map((item) => {
              const percent = Math.min(100, Math.round((item.available / Math.max(item.threshold * 2, 1)) * 100));
              const swatchIndex = Array.from(item.sku).reduce((sum, char) => sum + char.charCodeAt(0), 0) % swatches.length;
              const status = statuses[item.status];
              return <tr key={item.id} className="transition hover:bg-brand-soft/20">
                <td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${swatches[swatchIndex]}`}><Package size={17} className="text-gray-700/70" /></span><span><strong className="block text-sm font-semibold text-gray-800">{item.product}</strong><small className="mt-0.5 block text-xs text-gray-500">{item.variant}</small></span></div></td>
                <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{item.sku}</td><td className="px-4 py-3.5 text-gray-600">{item.category}</td>
                <td className="px-4 py-3.5"><div className="w-28" title={`${item.available} units available`}><div className="flex justify-between text-xs font-semibold text-gray-700"><span>{item.stock} units</span><span className="text-gray-400">{percent}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div style={{ width: `${percent}%` }} className={`h-full rounded-full ${item.available <= item.threshold ? "bg-accent" : "bg-brand"}`} /></div></div></td>
                <td className="px-4 py-3.5 text-gray-600">{item.reserved}</td><td className="px-4 py-3.5 text-gray-600">{item.threshold}</td>
                <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}><span className="size-1.5 rounded-full bg-current" />{status.label}</span></td>
                <td className="px-4 py-3.5">{onEditThreshold && <button type="button" onClick={() => onEditThreshold(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand/15 px-2.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-soft"><Pencil size={13} />Threshold</button>}</td>
              </tr>;
            })}
            {!items && <tr><td colSpan={8} className="px-4 py-14 text-center"><AdminRequestState request={request} label="inventory" /></td></tr>}
            {items?.length === 0 && <tr><td colSpan={8} className="px-4 py-14 text-center"><AlertCircle className="mx-auto text-accent" size={24} /><p className="mt-3 text-sm font-semibold text-gray-800">No matching variants</p><p className="mt-1 text-xs text-gray-500">Try changing the search term or stock status.</p></td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-5">
        <span>{items && `Showing ${items.length} product variants`}</span>
        <details className="relative">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1 text-brand hover:bg-brand-soft"><MoreHorizontal size={16} />View options</summary>
          <div className="absolute right-0 bottom-8 z-10 w-40 rounded-lg border border-line bg-white p-1 shadow-sm">
            <button type="button" onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
              void request.refetch();
            }} className="block w-full rounded px-2 py-1.5 text-left text-brand hover:bg-brand-soft">Refresh stock</button>
            {canExport && items && <button type="button" onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
              exportInventory(items);
            }} className="block w-full rounded px-2 py-1.5 text-left text-brand hover:bg-brand-soft">Export visible variants</button>}
          </div>
        </details>
      </footer>
    </div>
  );
}
