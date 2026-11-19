import type { StaffRole } from "./types";

export const accessKeys = {
  all: ["access"] as const,
  roles: () => [...accessKeys.all, "roles"] as const,
  audit: (role: StaffRole) => [...accessKeys.all, "audit", role] as const,
};
