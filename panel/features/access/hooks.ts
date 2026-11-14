"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accessApi } from "./api";
import { accessKeys } from "./keys";
import type { UpdateRolePermissionsInput } from "./types";

export function useAccessRoles() {
  return useQuery({
    queryKey: accessKeys.roles(),
    queryFn: accessApi.roles,
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: UpdateRolePermissionsInput) =>
      accessApi.updateRolePermissions(role, permissions),
    meta: { successMessage: "Role permissions saved." },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accessKeys.roles() }),
  });
}
