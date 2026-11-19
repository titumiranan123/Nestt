"use client";

import { useState } from "react";
import { InventoryFilters } from "@/components/admin/inventory/InventoryFilters";
import { InventoryHeader } from "@/components/admin/inventory/InventoryHeader";
import { InventoryStatCards } from "@/components/admin/inventory/InventoryStatCards";
import { InventoryTable } from "@/components/admin/inventory/InventoryTable";
import { ThresholdDrawer } from "@/components/admin/inventory/ThresholdDrawer";
import { useInventory } from "@/features/inventory/hooks";
import type { InventoryItem } from "@/features/inventory/types";
import { matchesInventorySearch } from "@/features/inventory/utils";
import { usePermission } from "@/hooks/use-permission";

export function InventoryManager() {
  const request = useInventory();
  const canEdit = usePermission("inventory:update");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const filteredItems = request.data?.filter((item) =>
    (status === "ALL" || item.status === status) &&
    matchesInventorySearch(search, item.sku, item.product, item.category, item.brand, item.variant),
  );

  return <main className="space-y-4 p-4 sm:p-6 lg:p-7">
    <InventoryHeader showPrimary={canEdit} />
    <InventoryStatCards items={request.data} />
    <InventoryFilters search={search} status={status} onSearch={setSearch} onStatus={setStatus} onReset={() => { setSearch(""); setStatus("ALL"); }} />
    <InventoryTable items={filteredItems} request={request} onEditThreshold={canEdit ? setEditing : undefined} />
    <ThresholdDrawer item={editing} onClose={() => setEditing(null)} />
  </main>;
}
