"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export type PolicyKey = "policy_refund" | "policy_privacy" | "policy_terms" | "policy_shipping";
type Policy = { key: PolicyKey; value: string };
type OrderFormat = { prefix: string; startNumber: number; suffix: string };

type GeneralSettings = {
  policies: (Policy & { updatedAt: string })[];
  orderFormat: (OrderFormat & { nextNumber: string }) | null;
};
type SaveGeneralSettings = { policies: Policy[]; orderFormat?: OrderFormat };

const settingsKey = ["admin", "general-settings"] as const;
const path = "/admin/general-settings";

export function useGeneralSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: ({ signal }) => apiClient<GeneralSettings>(path, { signal }),
    staleTime: 0,
    meta: { silent: true },
  });
}

export function useSaveGeneralSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveGeneralSettings) => apiClient<GeneralSettings>(path, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    onMutate: () => client.cancelQueries({ queryKey: settingsKey }),
    onSuccess: (settings) => client.setQueryData(settingsKey, settings),
    meta: { silent: true },
  });
}
