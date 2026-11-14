"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { InventoryHeader } from "@/components/admin/inventory/InventoryHeader";
import { InventoryTable } from "@/components/admin/inventory/InventoryTable";
import { ThresholdDrawer } from "@/components/admin/inventory/ThresholdDrawer";
import { demoInventory, inventoryStatus, type InventoryItem } from "@/lib/inventory-media-demo";

export function LowStockPage() {
  const [items, setItems] = useState<InventoryItem[]>(demoInventory);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const lowItems = useMemo(() => items.map((item) => ({ ...item, status: inventoryStatus(item.stock, item.threshold) })).filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK").filter((item) => !search || [item.product, item.sku, item.category].some((value) => value.toLowerCase().includes(search.toLowerCase()))), [items, search]);
  const updateThreshold = (id: string, threshold: number) => setItems((current) => current.map((item) => item.id === id ? { ...item, threshold } : item));

  return <main className="space-y-4 p-4 sm:p-6 lg:p-7">
    <InventoryHeader eyebrow="Inventory alerts" title="Low Stock Items" description="Variants that are at or below their alert quantity. Review the list and record a restock when inventory arrives." secondaryHref="/admin/inventory" secondaryLabel="All Inventory" primaryHref="/admin/inventory/adjustments" primaryLabel="Restock now" />
    <section className="flex flex-col justify-between gap-4 rounded-2xl border border-accent/15 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:px-5">
<div className="flex items-center gap-3">
<span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
<AlertTriangle size={19} />
</span>
<div>
<p className="text-sm font-bold text-gray-900">{lowItems.length} variants need attention</p>
<p className="mt-0.5 text-xs text-gray-600">{lowItems.filter((item) => item.stock === 0).length} are currently out of stock</p>
</div>
</div>
<Link href="/admin/inventory/adjustments" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark">Open stock adjustment <ArrowRight size={14} />
</Link>
</section>
    <label className="flex h-11 max-w-xl items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-brand shadow-sm focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
<Search size={17} />
<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or category" className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400" />
</label>
    <InventoryTable items={lowItems} onEditThreshold={setEditing} />
    <ThresholdDrawer item={editing} onClose={() => setEditing(null)} onSave={updateThreshold} />
  </main>;
}
