import { apiClient } from "@/lib/api/client";

export type ReportKind = "sales" | "products" | "inventory" | "customers" | "revenue";
export type ReportQuery = { from?: string; to?: string; page?: number; limit?: number; search?: string; status?: string; paymentStatus?: string; type?: string };
export type ReportPayload = Record<string, any>;

export function getReport(kind: ReportKind, query: ReportQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
  return apiClient<ReportPayload>(`/admin/reports/${kind}?${params}`, { signal });
}
