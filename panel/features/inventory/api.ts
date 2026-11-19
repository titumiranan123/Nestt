import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AdjustmentInput, AdjustmentLog, InventoryItem } from "./types";

export const inventoryApi = {
  list: (signal: AbortSignal) => apiClient<InventoryItem[]>(endpoints.inventory.list, { signal }),
  adjustments: (signal: AbortSignal) => apiClient<AdjustmentLog>(endpoints.inventory.adjustments, { signal }),
  record: (input: AdjustmentInput) => apiClient<{ id: string }>(endpoints.inventory.adjustments, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  }),
  saveThreshold: ({ id, threshold }: { id: string; threshold: number }) =>
    apiClient<{ id: string; threshold: number }>(endpoints.inventory.threshold(id), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ threshold }),
    }),
};
