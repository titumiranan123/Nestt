"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { InventoryHeader } from "@/components/admin/inventory/InventoryHeader";
import { InventoryTable } from "@/components/admin/inventory/InventoryTable";
import { ThresholdDrawer } from "@/components/admin/inventory/ThresholdDrawer";
import { useInventory } from "@/features/inventory/hooks";
import type { InventoryItem } from "@/features/inventory/types";
import { matchesInventorySearch, needsReplenishment } from "@/features/inventory/utils";
import { usePermission } from "@/hooks/use-permission";

export function LowStockPage() {
  const request = useInventory();
  const canEdit = usePermission("inventory:update");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const lowItems = request.data?.filter(needsReplenishment);
  const visibleItems = lowItems?.filter((item) => matchesInventorySearch(search, item.product, item.sku, item.category));

  return <main className="space-y-4 p-4 sm:p-6 lg:p-7">
    <InventoryHeader eyebrow="Inventory alerts" title="Low Stock Items" description="Variants that are at or below their alert quantity. Review the list and record a restock when inventory arrives." secondaryHref="/admin/inventory" secondaryLabel="All Inventory" primaryHref="/admin/inventory/adjustments" primaryLabel="Restock now" showPrimary={canEdit} />
    <section className="flex flex-col justify-between gap-4 rounded-2xl border border-accent/15 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:px-5">
<div className="flex items-center gap-3">
<span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
<AlertTriangle size={19} />
</span>
<div>
<p className="text-sm font-bold text-gray-900">{lowItems ? `${lowItems.length} variants need attention` : "Low stock summary"}</p>
<p className="mt-0.5 text-xs text-gray-600">{lowItems && `${lowItems.filter((item) => item.status === "OUT_OF_STOCK").length} are currently out of stock`}</p>
</div>
</div>
{canEdit && <Link href="/admin/inventory/adjustments" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark">Open stock adjustment <ArrowRight size={14} />
</Link>}
</section>
    <label className="flex h-11 max-w-xl items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-brand shadow-sm focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
<Search size={17} />
<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or category" className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400" />
</label>
    <InventoryTable items={visibleItems} request={request} onEditThreshold={canEdit ? setEditing : undefined} />
    <ThresholdDrawer item={editing} onClose={() => setEditing(null)} />
  </main>;
}
