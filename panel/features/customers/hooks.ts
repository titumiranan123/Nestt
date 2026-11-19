"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "./api";
import { dashboardKeys } from "@/features/dashboard/keys";
import type { CustomerListQuery, CustomerStatus } from "./types";

const customerListsKey = ["customers", "list"] as const;

export function useCustomers(query: CustomerListQuery) {
  return useQuery({
    queryKey: [...customerListsKey, query],
    queryFn: ({ signal }) => customersApi.list(query, signal),
  });
}

export function useCustomerActions() {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: customerListsKey }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.overview }),
  ]);
  const save = useMutation({
    mutationFn: customersApi.save,
    onSuccess: refresh,
    meta: { successMessage: "Customer saved." },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CustomerStatus }) => customersApi.save({ id, profile: { status } }),
    onSuccess: refresh,
    meta: { successMessage: "Customer status updated." },
  });
  const remove = useMutation({
    mutationFn: customersApi.remove,
    onSuccess: refresh,
    meta: { successMessage: "Customer removed." },
  });
  const exportCsv = useMutation({ mutationFn: customersApi.exportCsv });
  return { save, updateStatus, remove, exportCsv };
}
