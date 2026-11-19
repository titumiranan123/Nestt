"use client";

import { useState } from "react";
import { ArrowLeft, Download, ClipboardList } from "lucide-react";
import Link from "next/link";
import { AdjustmentFilters } from "@/components/admin/inventory/AdjustmentFilters";
import { AdjustmentHistoryTable } from "@/components/admin/inventory/AdjustmentHistoryTable";
import { StockAdjustmentForm } from "@/components/admin/inventory/StockAdjustmentForm";
import { useAdjustmentLog } from "@/features/inventory/hooks";
import { exportAdjustmentHistory, matchesInventorySearch } from "@/features/inventory/utils";
import { usePermission } from "@/hooks/use-permission";

export function InventoryAdjustmentsPage() {
  const request = useAdjustmentLog();
  const canReadInventory = usePermission("inventory:read");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const visibleHistory = request.data?.movements.filter((entry) =>
    (type === "ALL" || entry.type === type) && matchesInventorySearch(query, entry.sku, entry.product, entry.reason),
  );

  return <main className="space-y-5 p-4 sm:p-6 lg:p-7">
    <header className="flex flex-col justify-between gap-4 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand-soft/70 via-white to-orange-50/70 p-5 sm:flex-row sm:items-center sm:p-6">
      <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Inventory movement</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Stock Adjustments</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Record manual stock changes and audit every inventory movement.</p></div>
      <div className="flex flex-wrap gap-2">{canReadInventory && <Link href="/admin/inventory" className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/15 bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-soft"><ArrowLeft size={15} />Inventory</Link>}<button type="button" disabled={!visibleHistory} onClick={() => { if (visibleHistory) exportAdjustmentHistory(visibleHistory); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Download size={15} />Export log</button></div>
    </header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(330px,0.78fr)_minmax(0,1.6fr)]">
      <StockAdjustmentForm items={request.data?.variants} loading={request.isPending} />
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><div className="flex items-center gap-3 px-4 pt-4 sm:px-5"><span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><ClipboardList size={17} /></span><div><p className="text-sm font-bold text-gray-900">Movement log</p><p className="mt-0.5 text-xs text-gray-500">Search and filter your inventory activity</p></div></div><AdjustmentFilters query={query} type={type} onQuery={setQuery} onType={setType} /><AdjustmentHistoryTable items={visibleHistory} request={request} /></section>
    </div>
  </main>;
}
