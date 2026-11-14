"use client";

import { useMemo, useState } from "react";
import { InventoryFilters } from "@/components/admin/inventory/InventoryFilters";
import { InventoryHeader } from "@/components/admin/inventory/InventoryHeader";
import { InventoryStatCards } from "@/components/admin/inventory/InventoryStatCards";
import { InventoryTable } from "@/components/admin/inventory/InventoryTable";
import { ThresholdDrawer } from "@/components/admin/inventory/ThresholdDrawer";
import { demoInventory, inventoryStatus, type InventoryItem } from "@/lib/inventory-media-demo";

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>(demoInventory);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const hydratedItems = useMemo(
    () => items.map((item) => ({ ...item, status: inventoryStatus(item.stock, item.threshold) })),
    [items],
  );
  const filteredItems = useMemo(() => hydratedItems.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.sku, item.product, item.category, item.brand, item.variant]
      .some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (status === "ALL" || item.status === status);
  }), [hydratedItems, search, status]);
  const saveThreshold = (id: string, threshold: number) => setItems((current) => current.map((item) => item.id === id ? { ...item, threshold } : item));

  return <main className="space-y-4 p-4 sm:p-6 lg:p-7">
    <InventoryHeader />
    <InventoryStatCards items={hydratedItems} />
    <InventoryFilters search={search} status={status} onSearch={setSearch} onStatus={setStatus} onReset={() => { setSearch(""); setStatus("ALL"); }} />
    <InventoryTable items={filteredItems} onEditThreshold={setEditing} />
    <ThresholdDrawer item={editing} onClose={() => setEditing(null)} onSave={saveThreshold} />
  </main>;
}
