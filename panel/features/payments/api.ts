import { apiClient } from "@/lib/api/client";

export type PaymentSettings = {
  ssl: { status: boolean; credentialsConfigured: boolean; updatedAt: string } | null;
};

export type SaveSslSettings = {
  storeId?: string;
  storePass?: string;
  status?: boolean;
};

export const paymentConfigApi = {
  get: (signal?: AbortSignal) => apiClient<PaymentSettings>("/admin/payment-config", { signal }),
  saveSsl: (settings: SaveSslSettings) => apiClient<NonNullable<PaymentSettings["ssl"]>>(
    "/admin/payment-config/ssl",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    },
  ),
};
