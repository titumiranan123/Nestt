export const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SUPPORT", "CUSTOMER"] as const;

export type Role = (typeof roles)[number];
export type StaffRole = Exclude<Role, "CUSTOMER">;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.some((role) => role === value);
}

export function isAdminRole(value: unknown): value is Extract<Role, "SUPER_ADMIN" | "ADMIN"> {
  return value === "SUPER_ADMIN" || value === "ADMIN";
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "SUPER_ADMIN" || value === "ADMIN" || value === "MANAGER" || value === "SUPPORT";
}
