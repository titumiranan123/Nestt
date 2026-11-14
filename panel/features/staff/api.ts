import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { CreateStaffInput, StaffListQuery, StaffListResponse, UpdateStaffInput } from "./types";
import type { DemoStaff } from "@/lib/admin-operations-demo";

export const staffApi = {
  list: (query: StaffListQuery) => {
    const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
    if (query.search) params.set("search", query.search);
    if (query.role) params.set("role", query.role);
    if (query.status) params.set("status", query.status);
    return apiClient<StaffListResponse>(`${endpoints.staff.list}?${params.toString()}`);
  },
  create: (input: CreateStaffInput) => apiClient<DemoStaff>(endpoints.staff.list, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }),
  update: (id: string, input: UpdateStaffInput) => apiClient<DemoStaff>(endpoints.staff.item(id), {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }),
  remove: (id: string) => apiClient<void>(endpoints.staff.item(id), { method: "DELETE" }),
  resetPassword: (id: string, password: string) => apiClient<{ id: string; passwordReset: boolean }>(endpoints.staff.password(id), {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }),
  }),
};
