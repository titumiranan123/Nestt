import type { Permission } from "./permissions";

export function can(permission: Permission, granted: readonly Permission[] | null | undefined): boolean {
  return granted?.includes(permission) ?? false;
}
