"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentConfigApi, type PaymentSettings } from "./api";

const paymentSettingsKey = ["admin", "payment-settings"] as const;

export function usePaymentSettings(enabled: boolean) {
  return useQuery({
    queryKey: paymentSettingsKey,
    queryFn: ({ signal }) => paymentConfigApi.get(signal),
    enabled,
    meta: { silent: true },
  });
}

export function useSavePaymentSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: paymentConfigApi.saveSsl,
    gcTime: 0,
    meta: { silent: true },
    onMutate: () => client.cancelQueries({ queryKey: paymentSettingsKey }),
    onSuccess: (ssl) => client.setQueryData<PaymentSettings>(paymentSettingsKey, { ssl }),
  });
}
