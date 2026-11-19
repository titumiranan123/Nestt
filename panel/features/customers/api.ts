import { apiClient, apiDownload } from "@/lib/api/client";
import type { CustomerDateRange, CustomerList, CustomerListQuery, CustomerSaveInput } from "./types";

const customersPath = "/admin/customers";

function params(filters: Record<string, string | number>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const isUnfiltered = (key === "status" || key === "verification") && value === "ALL";
    if (value !== "" && !isUnfiltered) query.set(key, String(value));
  }
  return query.toString();
}

export const customersApi = {
  list(query: CustomerListQuery, signal: AbortSignal) {
    return apiClient<CustomerList>(`${customersPath}?${params(query)}`, { signal });
  },
  save({ id, profile, avatar }: { id?: string; profile: Partial<CustomerSaveInput>; avatar?: File | null }) {
    const body = new FormData();
    body.set("profile", JSON.stringify(profile));
    if (avatar) body.set("avatar", avatar);
    return apiClient<{ id: string }>(id ? `${customersPath}/${id}` : customersPath, {
      method: id ? "PATCH" : "POST",
      body,
    });
  },
  remove(id: string) {
    return apiClient<void>(`${customersPath}/${id}`, { method: "DELETE" });
  },
  exportCsv(range: CustomerDateRange) {
    return apiDownload(`${customersPath}/export?${params(range)}`);
  },
};
