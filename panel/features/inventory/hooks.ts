"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "./api";
import { inventoryKeys } from "./keys";
import { dashboardKeys } from "@/features/dashboard/keys";
import { productKeys } from "@/features/products/keys";

export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.list,
    queryFn: ({ signal }) => inventoryApi.list(signal),
    staleTime: 0,
  });
}

export function useAdjustmentLog() {
  return useQuery({
    queryKey: inventoryKeys.adjustments,
    queryFn: ({ signal }) => inventoryApi.adjustments(signal),
    staleTime: 0,
  });
}

export function useSaveThreshold() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: inventoryApi.saveThreshold,
    meta: { successMessage: "Alert quantity updated." },
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: inventoryKeys.list }),
      client.invalidateQueries({ queryKey: productKeys.all }),
      client.invalidateQueries({ queryKey: dashboardKeys.overview }),
      client.invalidateQueries({ queryKey: dashboardKeys.inventoryAlerts }),
    ]),
  });
}

export function useRecordAdjustment() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: inventoryApi.record,
    meta: { successMessage: "Stock adjustment recorded." },
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: inventoryKeys.all }),
      client.invalidateQueries({ queryKey: productKeys.all }),
      client.invalidateQueries({ queryKey: dashboardKeys.overview }),
      client.invalidateQueries({ queryKey: dashboardKeys.inventoryAlerts }),
    ]),
  });
}
