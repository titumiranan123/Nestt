"use client";

import { useSession } from "next-auth/react";
import type { Permission } from "@/lib/rbac/permissions";
import { can } from "@/lib/rbac/can";

export function usePermission(permission: Permission): boolean {
  const { data } = useSession();
  return can(permission, data?.user?.permissions);
}
