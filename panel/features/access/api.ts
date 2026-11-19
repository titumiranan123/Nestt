import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AccessRolesResponse, EditableRole, RoleAuditEntry, StaffRole } from "./types";

export const accessApi = {
  roles: () => apiClient<AccessRolesResponse>(endpoints.access.roles),
  audit: (role: StaffRole, signal?: AbortSignal) =>
    apiClient<RoleAuditEntry[]>(`${endpoints.access.roles}/${role}/audit`, { signal }),
  updateRolePermissions: (role: EditableRole, permissions: string[]) =>
    apiClient<{ role: EditableRole; permissions: string[] }>(endpoints.access.rolePermissions(role), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permissions }),
    }),
};
