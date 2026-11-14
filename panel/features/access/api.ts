import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AccessRolesResponse, EditableRole } from "./types";

export const accessApi = {
  roles: () => apiClient<AccessRolesResponse>(endpoints.access.roles),
  updateRolePermissions: (role: EditableRole, permissions: string[]) =>
    apiClient<{ role: EditableRole; permissions: string[] }>(endpoints.access.rolePermissions(role), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permissions }),
    }),
};
