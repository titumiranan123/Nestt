import type { DemoRole } from "@/lib/admin-operations-demo";

export type EditableRole = Exclude<DemoRole, "SUPER_ADMIN">;

export type AccessPermission = {
  key: string;
  resource: string;
  action: string;
  description: string | null;
};

export type RolePermission = {
  role: DemoRole;
  permissions: string[];
};

export type AccessRolesResponse = {
  permissions: AccessPermission[];
  roles: RolePermission[];
};

export type UpdateRolePermissionsInput = {
  role: EditableRole;
  permissions: string[];
};
