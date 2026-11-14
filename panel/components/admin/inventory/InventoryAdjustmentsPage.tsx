"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, ClipboardList } from "lucide-react";
import Link from "next/link";
import { AdjustmentFilters } from "@/components/admin/inventory/AdjustmentFilters";
import { AdjustmentHistoryTable } from "@/components/admin/inventory/AdjustmentHistoryTable";
import { StockAdjustmentForm } from "@/components/admin/inventory/StockAdjustmentForm";
import { demoAdjustments, demoInventory, type AdjustmentItem, type InventoryItem } from "@/lib/inventory-media-demo";
import { showAdminNotice } from "@/lib/admin-swal";

export function InventoryAdjustmentsPage() {
  const [stock, setStock] = useState<InventoryItem[]>(demoInventory);
  const [history, setHistory] = useState<AdjustmentItem[]>(demoAdjustments);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const visibleHistory = useMemo(() => history.filter((entry) => {
    const normalized = query.toLowerCase().trim();
    const matches = !normalized || [entry.sku, entry.product, entry.reason].some((value) => value.toLowerCase().includes(normalized));
    return matches && (type === "ALL" || entry.type === type);
  }), [history, query, type]);
  const recordAdjustment = (adjustment: AdjustmentItem) => {
    setHistory((current) => [adjustment, ...current]);
    setStock((current) => current.map((item) => item.id === adjustment.variantId ? { ...item, stock: Math.max(0, item.stock + adjustment.quantity) } : item));
    void showAdminNotice("Adjustment recorded", "The demo stock level and activity history have been updated locally.", "success");
  };
  const exportHistory = () => {
    const rows = [["Date", "SKU", "Product", "Type", "Quantity", "Reason", "User"], ...visibleHistory.map((item) => [item.createdAt, item.sku, item.product, item.type, String(item.quantity), item.reason, item.user])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "nestt-stock-adjustments.csv"; link.click(); URL.revokeObjectURL(link.href);
  };

  return <main className="space-y-5 p-4 sm:p-6 lg:p-7">
    <header className="flex flex-col justify-between gap-4 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand-soft/70 via-white to-orange-50/70 p-5 sm:flex-row sm:items-center sm:p-6">
      <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-accent">Inventory movement</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Stock Adjustments</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Record manual stock changes and audit every inventory movement.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/inventory" className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/15 bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-soft"><ArrowLeft size={15} />Inventory</Link><button onClick={exportHistory} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white hover:bg-orange-700"><Download size={15} />Export log</button></div>
    </header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(330px,0.78fr)_minmax(0,1.6fr)]">
      <StockAdjustmentForm items={stock} onRecord={recordAdjustment} />
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><div className="flex items-center gap-3 px-4 pt-4 sm:px-5"><span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><ClipboardList size={17} /></span><div><p className="text-sm font-bold text-gray-900">Movement log</p><p className="mt-0.5 text-xs text-gray-500">Search and filter your inventory activity</p></div></div><AdjustmentFilters query={query} type={type} onQuery={setQuery} onType={setType} /><AdjustmentHistoryTable items={visibleHistory} /></section>
    </div>
  </main>;
}
