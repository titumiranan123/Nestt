"use client";

import type { ReactNode } from "react";
import type { Permission } from "@/lib/rbac/permissions";
import { usePermission } from "@/hooks/use-permission";

export function Can({ permission, children, fallback = null }: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return usePermission(permission) ? children : fallback;
}
