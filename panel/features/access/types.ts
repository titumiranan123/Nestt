import type { StaffRole } from "@/lib/rbac/roles";

export type { StaffRole } from "@/lib/rbac/roles";
export const roleLabels: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  SUPPORT: "Support",
};
export type EditableRole = Exclude<StaffRole, "SUPER_ADMIN">;

export type AccessPermission = {
  key: string;
  resource: string;
  action: string;
  description: string | null;
};

export type RolePermission = {
  role: StaffRole;
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

export type RoleAuditEntry = { id: string; actorEmail: string; createdAt: string };
