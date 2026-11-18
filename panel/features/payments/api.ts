import { apiClient } from "@/lib/api/client";

export type PaymentSettings = {
  ssl: { status: boolean; credentialsConfigured: boolean; updatedAt: string } | null;
};

export type SaveSslSettings = {
  storeId?: string;
  storePass?: string;
  status: boolean;
};

export const paymentConfigApi = {
  get: () => apiClient<PaymentSettings>("/admin/payment-config"),
  saveSsl: (settings: SaveSslSettings) => apiClient<NonNullable<PaymentSettings["ssl"]>>(
    "/admin/payment-config/ssl",
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    },
  ),
};
